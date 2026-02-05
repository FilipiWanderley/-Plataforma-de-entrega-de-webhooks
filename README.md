# Webhook Delivery Platform

Monorepo contendo a plataforma de entrega de webhooks.

## Estrutura do Projeto

*   `/backend`: Aplicação Spring Boot (Java 21)
*   `/frontend-react`: Developer Portal (React + Vite)
*   `/frontend-angular`: Ops Console (Angular)
*   `/infra`: Configurações de infraestrutura (Docker Compose, OpenTelemetry)

## Modelo de Dados (Postgres)

O banco de dados é migrado via Flyway e inclui as seguintes tabelas principais:
*   `tenants`: Clientes da plataforma.
*   `users`: Usuários com acesso (DEV/OPS).
*   `webhook_endpoints`: Destinos configurados pelos tenants.
*   `outbox_events`: Eventos recebidos e persistidos para garantia de entrega.
*   `delivery_jobs`: Controle do processo de entrega para cada endpoint.
*   `delivery_attempts`: Histórico de tentativas HTTP.
*   `dead_letters`: Mensagens que falharam após todas as tentativas.
*   `delivered_dedupe`: Controle de idempotência para evitar duplicidade.

## Pré-requisitos

*   Docker & Docker Compose
*   Java 21+
*   Node.js 18+ & NPM
*   Maven (opcional, pode usar `./mvnw` se gerado, mas aqui assumimos `mvn` instalado ou IDE)

## Frontend (React)

O projeto inclui um frontend em React (Vite) para gerenciamento da plataforma.

**Funcionalidades:**
* Login (simulado com token JWT).
* Gerenciamento de Endpoints (Lista, Criar, Editar).
* Visualização de Entregas (Lista com filtros, Detalhes com histórico de tentativas).
* Replay de mensagens na DLQ.
* Envio de Evento de Teste.

**Como rodar:**
```bash
cd frontend-react
npm install
npm run dev
```

Acesse em: `http://localhost:5173`
Credenciais de teste: `dev@local` / `password`

## Frontend (Angular)

Alternativa de frontend em Angular (v19+) focada em operações (OPS).

**Funcionalidades:**
* Login OPS.
* Dashboard Operacional (Métricas agregadas).
* Monitoramento de DLQ (Lista, Detalhes, Replay).
* Controle de Endpoints (Pausar/Bloquear/Ativar).

**Como rodar:**
```bash
cd frontend-angular
npm install
npm start
```

Acesse em: `http://localhost:4200`
Credenciais OPS: `ops@webhook.com` / `password` (Certifique-se de criar este usuário com role OPS no banco se não existir, ou use `dev@local` se ele tiver permissão)

## Testes End-to-End (E2E)

O projeto utiliza **Testcontainers** para testes de integração reais com Postgres e RabbitMQ, garantindo que o fluxo completo (API -> Banco -> Fila -> Worker -> Http) funcione corretamente.

**Requisitos:**
* Docker deve estar rodando (necessário para subir containers efêmeros de teste).

**Como rodar:**
```bash
cd backend
mvn test
```

Os cenários cobertos incluem:
* **Sucesso**: Criação de endpoint, envio de evento e entrega bem-sucedida (2xx).
* **Retry**: Simulação de erro 500 no destino, verificação de agendamento de retry e reenvio.
* **DLQ**: Validação de envio para Dead Letter Queue após exceder o número máximo de tentativas configurado.
* **Idempotência**: Garantia de que o mesmo evento não é entregue duplicado (Dedupe).

## Como rodar

### 1. Subir Infraestrutura

Antes de iniciar as aplicações, suba os serviços de dependência (Postgres, RabbitMQ, Redis, Otel):

```bash
cd infra
docker-compose up -d
```

Isso irá expor:
*   Postgres: porta 5432
*   RabbitMQ: porta 5672 (UI: 15672)
*   Redis: porta 6379
*   Otel Collector: portas 4317/4318

### 2. Rodar Backend (Java)

O backend se conecta nos serviços locais (localhost) por padrão.

```bash
cd backend
mvn spring-boot:run
```

A API estará disponível em `http://localhost:8080`.

**Autenticação (Users Seed):**
*   **Dev:** `dev@local` / `password`
*   **Ops:** `ops@local` / `password`

**Endpoints Principais:**
*   `POST /auth/login`: Obter token JWT
*   `GET /endpoints`: Listar endpoints (filtros: `status`)
*   `POST /endpoints`: Criar endpoint (Dev)
*   `POST /endpoints/{id}/block`: Bloquear endpoint (Ops Only)
*   `POST /events`: Enviar evento (payload JSON)
*   `GET /dlq`: Listar jobs na DLQ (Ops Only)
*   `POST /dlq/{id}/replay`: Reenviar job da DLQ (Ops Only)

### Observabilidade (Metrics & Tracing)
A plataforma expõe métricas e traces para monitoramento avançado:

*   **Logs JSON**: Logs estruturados com `traceId` e `spanId` para correlação (Logback + Logstash Encoder).
*   **Métricas (Micrometer/Prometheus)**:
    *   `webhook.delivery.success`: Contador de entregas bem-sucedidas.
    *   `webhook.delivery.failure`: Contador de falhas (tag `reason`).
    *   `webhook.delivery.latency`: Histograma de latência das entregas.
    *   `webhook.circuit_breaker.open`: Contador de aberturas de circuito.
    *   `webhook.dlq.events`: Contador de mensagens movidas para DLQ.
*   **Tracing (OpenTelemetry)**:
    *   `ingest-event`: Span de recebimento do evento na API.
    *   `dispatch-outbox`: Span de processamento do dispatcher.
    *   `process-event`: Span de consumo da mensagem.
    *   `execute-delivery`: Span da tentativa HTTP.

Endpoint de Métricas: `GET /actuator/prometheus`

### Retry Policy
A política de retry foi aprimorada para garantir robustez e evitar sobrecarga:
*   **Exponential Backoff + Jitter**: O tempo de espera entre tentativas cresce exponencialmente (2^n) com um fator de aleatoriedade (Jitter) de 20% para evitar *thundering herd*.
*   **Classificação de Falhas**:
    *   **Retryable**: Timeout, Network Error, HTTP 5xx, HTTP 429 (Too Many Requests).
    *   **Non-Retryable**: HTTP 404 (Not Found), 410 (Gone). Esses erros marcam o job imediatamente como `FAILED`.
    *   **Outros 4xx**: Por padrão não retentam.
*   **Delay Cap**: O tempo máximo de espera é limitado a 24 horas.

### Segurança e Assinatura (Webhook Signature)
Para garantir que os webhooks recebidos pelo destino são autênticos e não foram adulterados, cada requisição é assinada utilizando HMAC-SHA256.

Os seguintes headers são enviados:
*   `X-Webhook-Id`: ID único do evento (UUID).
*   `X-Webhook-Timestamp`: Timestamp (epoch millis) do momento do envio.
*   `X-Webhook-Signature`: Assinatura HMAC-SHA256 da string `timestamp + "." + payload` usando o `secret` do endpoint.
*   `User-Agent`: `WebhookPlatform/1.0`

**Validação (Exemplo):**
1. Receba o header `X-Webhook-Signature`, `X-Webhook-Timestamp` e o corpo da requisição (`rawBody`).
2. Concatene: `signed_payload = timestamp + "." + rawBody`.
3. Calcule o HMAC-SHA256 de `signed_payload` usando o seu `secret`.
4. Compare o hash calculado com `X-Webhook-Signature`.

### Concurrency Limit & Circuit Breaker
Para proteger tanto a plataforma quanto os endpoints de destino:

*   **Concurrency Limit**: Cada endpoint tem um limite configurável de envios simultâneos (default: 2). Se o limite for atingido, novas tentativas são agendadas para breve (backoff de 10s) ao invés de serem executadas imediatamente.
*   **Circuit Breaker**: Se um endpoint falhar consecutivamente **N vezes** (default: 5), ele entra em estado de "Circuit Breaker Open" e é **pausado por 5 minutos**.
    *   Durante este período, novos jobs são automaticamente agendados para o futuro (`nextAvailableAt`).
    *   Após o período, uma tentativa bem-sucedida fecha o circuito (zera o contador de falhas).
    *   O motivo da falha (`failure_reason`) é registrado no endpoint.

### 3. Rodar Frontend React (Dev Portal)

```bash
cd frontend-react
npm install
npm run dev
```

Acesse em `http://localhost:5173`.

### 4. Rodar Frontend Angular (Ops Console)

```bash
cd frontend-angular
npm install
npm start
```

Acesse em `http://localhost:4200`.

### 5. Mock Receiver (Para Testes de Webhook)

Serviço leve em Node.js para receber webhooks, simular status (200, 429, 500, timeouts) e validar assinaturas.

```bash
cd mock-receiver
npm install
npm start
```

Rodando na porta `3001`.

*   **POST** `http://localhost:3001/webhook/{status}?timeout={ms}`
    *   Exemplo: `/webhook/200` (Sucesso)
    *   Exemplo: `/webhook/500` (Erro interno)
    *   Exemplo: `/webhook/429` (Too Many Requests)
    *   Exemplo: `/webhook/200?timeout=5000` (Delay de 5s)
*   **GET** `http://localhost:3001/requests`
    *   Lista as últimas requisições recebidas (Headers e Body) para você validar o HMAC manualmente.
*   **DELETE** `http://localhost:3001/requests`
    *   Limpa o histórico.

## Componentes Internos

### Outbox Dispatcher
*   Job agendado que lê eventos `PENDING` da tabela `outbox_events`.
*   Utiliza `SELECT FOR UPDATE SKIP LOCKED` para garantir que apenas uma instância processe cada evento.
*   Publica no RabbitMQ (Exchange: `webhook.events.exchange`) e marca como `ENQUEUED`.
*   Em caso de falha no publish, a transação é revertida e o evento será retentado.

### Webhook Consumer & Delivery Service
*   Escuta a fila `webhook.events.queue`.
*   Para cada evento:
    1.  Busca endpoints ativos (`ACTIVE`) do tenant.
    2.  Verifica idempotência via tabela `delivered_dedupe` (Evita envio duplicado se mensagem for reprocessada).
    3.  Cria/Atualiza `delivery_jobs` e `delivery_attempts`.
    4.  Realiza POST HTTP.
    5.  **Sucesso (2xx)**: Marca job como `SUCCEEDED`, salva em `delivered_dedupe`.
    6.  **Falha**: Marca job como `PENDING` (ou `DLQ` se exceder max attempts) e agenda `next_attempt_at` com backoff exponencial.

### Retry Dispatcher
*   Job agendado que lê `delivery_jobs` com status `PENDING` e `next_attempt_at <= NOW`.
*   Utiliza `SELECT FOR UPDATE SKIP LOCKED` para concorrência segura.
*   Publica o ID do job na fila de retry (`webhook.jobs.retry.queue`).
*   Consumer específico (`WebhookJobConsumer`) processa o retry chamando o serviço de entrega.

### Dead Letter Queue (DLQ)
*   Jobs que excedem o número máximo de tentativas (configurado no endpoint) são movidos para status `DLQ`.
*   Registro detalhado salvo na tabela `dead_letters`.
*   Endpoints `/dlq` permitem listar e fazer "replay" (resetar para `PENDING` e zerar tentativas).

## Variáveis de Ambiente

As aplicações já vêm configuradas para rodar localmente com os defaults do docker-compose. Se precisar alterar:

**Backend (`application.properties`):**
*   `SPRING_DATASOURCE_URL`: URL do Postgres
*   `SPRING_RABBITMQ_HOST`: Host do RabbitMQ
*   `SPRING_RABBITMQ_PASSWORD`: Senha do RabbitMQ

**Frontend:**
*   Configurar via `.env` (React) ou `environment.ts` (Angular) para apontar para a API correta se mudar a porta.
