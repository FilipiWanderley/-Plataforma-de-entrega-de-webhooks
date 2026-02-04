# PRD — Webhook Delivery Platform (Java + React + Angular)

## 1) Visão do produto
Um serviço multi-tenant que entrega eventos (webhooks) para sistemas de terceiros com durabilidade, retry inteligente, dedupe/idempotência, DLQ + replay, assinatura HMAC, e painéis para Dev e Ops.
**Tagline:** “Webhook delivery confiável, auditável e observável”.

## 2) Problema de mercado (dor real)
Webhooks em produção falham por motivos previsíveis:
*   endpoints de clientes ficam fora/instáveis → timeouts/5xx
*   retries geram duplicidade (efeitos colaterais)
*   sem replay → suporte vira “apaga incêndio”
*   sem observabilidade → ninguém sabe “o que chegou / o que falhou / por quê”
*   sem governança → um tenant derruba os demais (falta de rate limit / isolamento)

## 3) Objetivos (Outcomes)
*   **O1.** Entregar eventos com garantia *at-least-once* e controle de duplicidade.
*   **O2.** Permitir investigação e *replay* com trilha de auditoria.
*   **O3.** Isolar tenants e endpoints com limites (concurrency/rate).
*   **O4.** Expor métricas e tracing para operação (p95, retries, DLQ).

**Métricas de sucesso:**
*   Delivery Success Rate (por tenant/endpoint)
*   p95/p99 latency de entrega
*   retries/entrega
*   tamanho e idade média da DLQ
*   MTTR (tempo pra recuperar falhas via replay)

## 4) Personas
*   **Dev Integrador (Tenant Dev):** cria endpoints, define segredo, testa, acompanha logs, faz replay.
*   **Ops/SRE (Tenant Ops/Admin):** investiga falhas, mexe em DLQ, bloqueia endpoint, vê dashboards.
*   **Plataforma (Owner do sistema):** quer isolamento, estabilidade, custo controlado.

## 5) Escopo MVP (primeira versão “portfolio-ready”)

### Funcional (MVP)
*   **Multi-tenant:** Tenant + usuários (DEV/OPS)
*   **CRUD de Webhook Endpoints:** URL, status (active/paused), secret, headers custom (opcional), max attempts
*   **Ingestão de eventos internos:** POST `/events` (gera evento para um tenant e tipo)
*   **Outbox pattern (durabilidade)**
*   **Fila de entrega:** (RabbitMQ no dev)
*   **Delivery worker:**
    *   retries com exponential backoff + jitter
    *   classificação de erro (timeout/5xx => retry, 4xx => regra)
    *   persistência de tentativas
*   **Dedupe:** cada evento tem `event_id` único e “delivered record” por (endpoint, event_id)
*   **DLQ + replay:** listar mensagens mortas, replay com motivo
*   **Assinatura HMAC:** headers: `X-Webhook-Id`, `X-Webhook-Timestamp`, `X-Webhook-Signature`
*   **Observabilidade:**
    *   logs estruturados + traceId
    *   métricas: success rate, retry count, p95, DLQ size

### Front React (Developer Portal)
*   endpoints + deliveries + replay + “send test event”

### Front Angular (Ops Console)
*   DLQ + bloquear endpoint + visão agregada por tenant

### Fora do escopo (por enquanto)
*   Multi-região, exactly-once end-to-end
*   UI avançada de templating de payload
*   Suporte a assinaturas múltiplas por endpoint, mTLS
*   Kafka/particionamento avançado

## 6) Regras de entrega (contrato)
*   **Semântica:** *at-least-once*.
*   **Duplicidade:** mitigada por `event_id` + registro de entrega no nosso lado; o consumidor ainda deve ser idempotente (documentado).
*   **Política de retry (padrão):**
    *   tentativas: 10
    *   base delay: 5s
    *   backoff: exponencial (ex.: 5s, 10s, 20s, 40s… até teto)
    *   jitter: ±20%
    *   timeout HTTP: 5s (config por endpoint)
*   **4xx:**
    *   410/404: marcar como FAILED (não retry) por padrão
    *   429: retry respeitando backoff (e opcional `Retry-After`)
    *   outros 4xx: configurável (padrão: não retry)
*   **5xx/timeout/network:** retry
*   **Circuit breaker (MVP leve):** se 5 falhas seguidas no endpoint → pausar 5 min automaticamente
*   **Limites (isolamento):**
    *   concurrency por endpoint: 2 (default, configurável)
    *   rate por tenant: 50 req/min (MVP simples)

## 7) Fluxos principais

### 7.1 Criar endpoint (Dev Portal)
*   Dev cria endpoint, define secret
*   Dev envia “test event”
*   Portal mostra delivery attempts e assinatura HMAC para validação

### 7.2 Ingestão e entrega
*   produtor chama POST `/events`
*   backend grava `outbox_event` + `domain_event`
*   dispatcher lê outbox e enfileira job
*   worker envia HTTP, grava attempt
    *   sucesso → marca delivered
    *   falha → agenda retry ou DLQ

### 7.3 DLQ + replay (Ops Console)
*   Ops filtra DLQ por tenant/endpoint/código
*   abre detalhe e reprocessa (replay)
*   trilha auditável de quem fez replay e quando

## 8) Modelo de dados (PostgreSQL)
*   **tenants:** id, name, status, created_at
*   **users:** id, tenant_id, email, password_hash, role (DEV/OPS), created_at
*   **webhook_endpoints:** id, tenant_id, name, url, status(active/paused), secret, max_attempts, timeout_ms, concurrency_limit, created_at
*   **event_types (opcional no MVP):** id, tenant_id, key
*   **outbox_events:** id (uuid), tenant_id, event_type, payload_json, status(PENDING/ENQUEUED/PUBLISHED), created_at, published_at
*   **delivery_jobs (opcional):** id, endpoint_id, outbox_event_id, status(PENDING/IN_PROGRESS/SUCCEEDED/FAILED/DLQ), next_attempt_at, attempt_count
*   **delivery_attempts:** id, delivery_job_id, attempt_no, http_status, error_type, duration_ms, response_snippet, created_at
*   **dead_letters:** id, delivery_job_id, reason, created_at
*   **delivered_dedupe:** endpoint_id, outbox_event_id (unique), delivered_at

**Índices:**
*   `outbox_events(status, created_at)`
*   `delivery_jobs(endpoint_id, next_attempt_at)`
*   `delivery_attempts(delivery_job_id, attempt_no desc)`
*   `delivered_dedupe(endpoint_id, outbox_event_id unique)`

## 9) API (MVP)

### Auth
*   POST `/auth/login` → JWT
*   Roles: DEV, OPS

### Dev Portal
*   GET `/endpoints`
*   POST `/endpoints`
*   PATCH `/endpoints/{id}` (pause/resume, config)
*   POST `/endpoints/{id}/test` (gera evento de teste)
*   GET `/deliveries?endpointId=&status=&from=&to=`
*   GET `/deliveries/{id}` (attempts)
*   POST `/deliveries/{id}/replay`

### Ops
*   GET `/dlq?tenantId=&endpointId=`
*   POST `/dlq/{id}/replay`
*   POST `/endpoints/{id}/block` (pause)

### Event ingestion
*   POST `/events` (tenantId, eventType, payload)

## 10) Segurança
*   JWT + RBAC
*   **Secrets:** armazenar com criptografia (MVP: no mínimo at-rest via app-level encryption com key local/env)
*   **Assinatura HMAC:** `sig = HMAC_SHA256(secret, timestamp + "." + rawBody)`
*   **Proteções:**
    *   rate limit por tenant na API
    *   validação de URL (bloquear localhost/metadata IPs se você quiser “security hard mode”)

## 11) Observabilidade e Operação
*   **Logs JSON:** `tenantId`, `endpointId`, `outboxId`, `deliveryId`, `attemptNo`, `traceId`
*   **Métricas:**
    *   `webhook_delivery_success_total{tenant,endpoint}`
    *   `webhook_delivery_failure_total{...}`
    *   `webhook_delivery_latency_ms` (histogram)
    *   `webhook_dlq_size{tenant}`
    *   `webhook_retry_count_total`
*   **Tracing:**
    *   **spans:** ingest → outbox → enqueue → delivery attempt

## 12) Qualidade e testes
*   **Unit:** domínio/retry policy
*   **Integration:** Testcontainers com Postgres + RabbitMQ
*   **Contract test:** payload + headers HMAC
*   **Teste de carga leve:** k6/JMeter opcional
*   **Chaos básico:** mock receiver respondendo 500/timeout/429

## 13) Definition of Done (DoD)
*   sobe com `docker-compose up` e roda end-to-end
*   UI mostra deliveries + attempts + replay
*   retries e DLQ funcionam (com mock receiver)
*   métricas e tracing expostos
*   README com arquitetura e comandos

