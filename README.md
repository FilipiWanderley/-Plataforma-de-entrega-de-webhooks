# Webhook Delivery Platform

Monorepo contendo a plataforma de entrega de webhooks.

## Estrutura do Projeto

*   `/backend`: Aplicação Spring Boot (Java 21)
*   `/frontend-react`: Developer Portal (React + Vite)
*   `/frontend-angular`: Ops Console (Angular)
*   `/infra`: Configurações de infraestrutura (Docker Compose, OpenTelemetry)

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

## Variáveis de Ambiente

As aplicações já vêm configuradas para rodar localmente com os defaults do docker-compose. Se precisar alterar:

**Backend (`application.properties`):**
*   `SPRING_DATASOURCE_URL`: URL do Postgres
*   `SPRING_RABBITMQ_HOST`: Host do RabbitMQ
*   `SPRING_RABBITMQ_PASSWORD`: Senha do RabbitMQ

**Frontend:**
*   Configurar via `.env` (React) ou `environment.ts` (Angular) para apontar para a API correta se mudar a porta.
