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
    6.  **Falha**: Marca job como `PENDING` (ou `FAILED` se exceder max attempts) e agenda `next_attempt_at` com backoff exponencial.

## Variáveis de Ambiente

As aplicações já vêm configuradas para rodar localmente com os defaults do docker-compose. Se precisar alterar:

**Backend (`application.properties`):**
*   `SPRING_DATASOURCE_URL`: URL do Postgres
*   `SPRING_RABBITMQ_HOST`: Host do RabbitMQ
*   `SPRING_RABBITMQ_PASSWORD`: Senha do RabbitMQ

**Frontend:**
*   Configurar via `.env` (React) ou `environment.ts` (Angular) para apontar para a API correta se mudar a porta.
