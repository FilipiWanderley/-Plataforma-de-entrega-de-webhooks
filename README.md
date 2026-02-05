# Webhook Delivery Platform (Outbound Webhooks)

Plataforma **multi-tenant** de entrega de webhooks com foco em **confiabilidade operacional**: **Transactional Outbox**, **retry com backoff + jitter**, **DLQ + replay**, **HMAC signing**, **limites por endpoint**, **histórico de tentativas** e **observabilidade**.  
Inclui **Dev Portal (React + MUI DataGrid)** e **Ops Console (Angular + Angular Material)**.

---

## The Problem (Real-world)
Webhooks em produção quebram por motivos previsíveis:
- Endpoints de clientes ficam instáveis (**timeout / 5xx / 429**), causando tempestade de retries.
- Retries criam **duplicidade** e efeitos colaterais se não houver semântica explícita (**at-least-once**) e proteção contra duplicação.
- Sem **DLQ + replay**, o time de operações não recupera incidentes com segurança e rastreabilidade.
- Sem **métricas/tracing**, investigar vira tentativa e erro.
- Sem isolamento/limites, um único endpoint barulhento degrada todo o sistema.

Este projeto implementa o kit de confiabilidade usado em SaaS de verdade para delivery de webhooks.

---

## Key Features

### Reliability
- **Transactional Outbox**: grava o evento de forma durável antes de enfileirar/entregar.
- **Delivery semantics**: **at-least-once** com proteção de **dedupe** por `(endpoint_id, event_id)`.
- **Retry policy**: exponential backoff + jitter, com classificação por tipo de falha (timeout/5xx/429/4xx).
- **DLQ + Replay**: dead letters com replay manual e trilha de tentativa.
- **Concurrency limit / Endpoint protection**: evita saturação e protege o worker.

### Security
- **HMAC-SHA256** por endpoint secret.
- Headers padronizados: `X-Webhook-Id`, `X-Webhook-Timestamp`, `X-Webhook-Signature`.

### Operations & Observability
- Histórico completo de tentativas por entrega (status, latência, resposta parcial).
- Métricas e tracing para incident response.
- **Dev Portal**: gerencia endpoints, visualiza deliveries, replays e “test event”.
- **Ops Console**: DLQ, bloqueio/pausa de endpoint, triagem e visão agregada.

---

## Architecture Overview

### High-level Flow
```mermaid
flowchart LR
  P[Producer /events] --> DB[(PostgreSQL)]
  DB -->|Transactional Outbox| OUT[Outbox Dispatcher]
  OUT --> Q[(Queue)]
  Q --> W[Delivery Worker]
  W -->|HTTP POST + HMAC| C[Customer Endpoint]
  W --> A[(Delivery Attempts)]
  W -->|max attempts exceeded| DLQ[(DLQ)]
  DLQ -->|Manual Replay| Q
Delivery Semantics (Explicit)
At-least-once: um evento pode ser entregue mais de uma vez em cenários de falha.

Dedupe guard: registro de “delivered” impede múltiplos “sucessos” do mesmo (endpoint, event_id).

Consumidores devem implementar idempotência (recomendado na integração).

Core Modules
Ingestão (/events) → validação + persistência do evento no Outbox.

Outbox Dispatcher → lê eventos pendentes e publica jobs na fila.

Delivery Worker → envia HTTP, registra tentativas, aplica policy e decide sucesso/retry/DLQ.

Ops Tooling → DLQ, replay, pause/block endpoint.

Dev Tooling → endpoints, test event, deliveries.

Tech Stack (with Versions)
Preencha os REPLACE_ME com valores reais.
Sugestão: copie direto de backend/pom.xml e frontend-*/package.json.

Backend
Language: Java REPLACE_ME

Framework: Spring Boot REPLACE_ME

Build: Maven

Database: PostgreSQL REPLACE_ME

Migrations: Flyway REPLACE_ME

Messaging/Queue: RabbitMQ REPLACE_ME (ou Redis Streams REPLACE_ME, se aplicável)

Auth: Spring Security + JWT

Observability: Micrometer REPLACE_ME + OpenTelemetry REPLACE_ME (se aplicável)

Dev Portal (React)
Node: REPLACE_ME

React: REPLACE_ME

Vite: REPLACE_ME

UI: MUI REPLACE_ME

Data tables: MUI DataGrid REPLACE_ME

HTTP: Axios/fetch (conforme repo)

State/data: React Query (se aplicável)

Ops Console (Angular)
Angular: REPLACE_ME

Angular Material: REPLACE_ME

RxJS: REPLACE_ME

Repository Structure (Enterprise-Grade)
Ajuste nomes se seu repo usar nomes diferentes.

text
Copiar código
.
├─ backend/                        # Spring Boot (hexagonal-ish)
│  ├─ src/main/java/.../domain     # regras/entidades (core)
│  ├─ src/main/java/.../application# use-cases, services, ports
│  ├─ src/main/java/.../adapters   # web (controllers), persistence, messaging
│  ├─ src/main/java/.../infra      # config, scheduling, observability, queue
│  └─ src/main/resources/
│     ├─ db/migration              # Flyway migrations
│     └─ application-*.yml         # config por ambiente
├─ frontend-react/                 # Dev Portal (React + MUI + DataGrid)
│  ├─ src/app                      # providers, routing, shell/layout
│  ├─ src/features                 # features (endpoints, deliveries, etc.)
│  ├─ src/ui                       # UI kit (wrappers MUI, DataGrid wrapper)
│  ├─ src/lib                      # http client, utils, query client
│  └─ src/styles                   # theme/tokens
├─ frontend-angular/               # Ops Console (Angular + Material)
│  ├─ src/app/core                 # auth, interceptors, guards, api
│  ├─ src/app/shared               # ui components, pipes, directives
│  └─ src/app/features             # dlq, endpoints control, dashboard
├─ infra/                          # docker-compose + infra local
└─ docs/                           # architecture notes + repo polish summary
Domain Model (Conceptual)
Entidades típicas (nomes podem variar no código):

Tenant: isolamento por cliente/conta.

WebhookEndpoint: URL, secret, status, timeout, max attempts, limits.

OutboxEvent: evento durável a ser entregue.

DeliveryJob: job de entrega por endpoint/evento.

DeliveryAttempt: tentativa com status/latência/resposta parcial.

DeadLetter (DLQ): jobs que excederam tentativas/policy.

Webhook Contract (HMAC)
Headers enviados:

X-Webhook-Id: event_id

X-Webhook-Timestamp: unix timestamp (seconds)

X-Webhook-Signature: HMAC-SHA256

Signing input:

sql
Copiar código
timestamp + "." + rawBody
Exemplo (conceitual):

signature = HMAC_SHA256(secret, signingInput)

Encoding: hex ou base64 (conforme implementação)

Retry Policy (Summary)
Política típica (ajuste conforme o que está no código):

Timeout / network / 5xx → retry

429 → retry (respeita backoff; opcional Retry-After)

404/410 → fail sem retry (por padrão)

Outros 4xx → configurável (default: sem retry)

Backoff:

exponential + jitter

teto de delay

max attempts por endpoint

UI/UX (Enterprise SaaS)
Dev Portal (React)
Endpoints management (create/edit/pause/test)

Deliveries list + filters

Delivery detail (attempts timeline, payload viewer, replay)

Tables padronizadas com MUI DataGrid (sorting/pagination/states)

Ops Console (Angular)
DLQ triage + filtros

DLQ detail + replay

Endpoint control (pause/block)

Dashboard (métricas agregadas)

Screenshots: coloque em docs/screenshots/ e referencie aqui:

docs/screenshots/dev-portal-endpoints.png

docs/screenshots/dev-portal-delivery-detail.png

docs/screenshots/ops-dlq-list.png

docs/screenshots/ops-dlq-detail.png

docs/screenshots/ops-dashboard.png

Getting Started (Local Dev)
Prerequisites
Docker + Docker Compose

Java REPLACE_ME

Node REPLACE_ME

1) Start Infra
bash
Copiar código
cd infra
docker compose up -d
2) Run Backend
bash
Copiar código
cd backend
./mvnw spring-boot:run
3) Run Dev Portal (React)
bash
Copiar código
cd frontend-react
npm ci
npm run dev
4) Run Ops Console (Angular)
bash
Copiar código
cd frontend-angular
npm ci
npm start
Local URLs / Ports
Backend: http://localhost:REPLACE_ME

Dev Portal: http://localhost:REPLACE_ME

Ops Console: http://localhost:REPLACE_ME

Postgres/RabbitMQ: conforme infra/docker-compose.yml

Configuration
Infra: infra/docker-compose.yml

Backend:

application.yml / application-dev.yml

secrets via env vars (não commitar .env)

Frontends:

env vars para baseUrl da API (conforme seu setup)

Se existir .env.example, use como referência. Se não existir, crie um.

API (High-level)
Liste aqui apenas endpoints que existem no seu backend (ajuste nomes conforme controllers).

POST /auth/login → JWT

POST /events → cria outbox event

GET /endpoints / POST /endpoints / PATCH /endpoints/{id}

GET /deliveries / GET /deliveries/{id} / POST /deliveries/{id}/replay

GET /dlq / POST /dlq/{id}/replay

Observability
Logs estruturados com correlation/trace info (se habilitado).

Métricas (Actuator/Micrometer): success/failure counts, retries, DLQ size, latency histogram.

Tracing (OpenTelemetry): spans cobrindo ingest → outbox → enqueue → attempt → outcome.

Testing
Backend:

bash
Copiar código
cd backend
./mvnw test
React:

bash
Copiar código
cd frontend-react
npm run lint --if-present
npm run test --if-present
npm run build
Angular:

bash
Copiar código
cd frontend-angular
npm run lint --if-present
npm run test --if-present
npm run build
Repository Professionalization Notes
Este repositório foi padronizado para qualidade de manutenção:

Estrutura por camadas/features

Comentários “why-focused” apenas em áreas críticas

Documentação de arquitetura e decisões em docs/

Veja: docs/REPO_POLISH_SUMMARY.md

Roadmap (Next Improvements)
Rate limiting por tenant (quota) + prioridades por endpoint

Secret rotation UX + versionamento de assinatura

Analytics avançado de falhas (cluster por motivo/código)

Multi-worker scaling strategy + partitioning

Contract test pack para integradores

