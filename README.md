# Webhook Delivery Platform

Plataforma robusta para entrega de webhooks com alta confiabilidade, observabilidade e segurança.

## Arquitetura

```ascii
+-------------+      +-------------+      +-------------+
|   Client    | ---> |     API     | ---> |   Outbox    | (Postgres)
| (Producer)  |      |  (Spring)   |      +-------------+
+-------------+      +-------------+             |
                            |                    v
                     +-------------+      +-------------+
                     | Rate Limit  |      | Dispatcher  | (Polling/CDC)
                     | (Bucket4j)  |      +-------------+
                     +-------------+             |
                                                 v
                                          +-------------+
                                          |  RabbitMQ   | (Fanout/Queue)
                                          +-------------+
                                                 |
                                                 v
+-------------+      +-------------+      +-------------+
| Destination | <--- |  Consumer   | <--- |   Worker    |
| (Endpoint)  |      | (WebClient) |      +-------------+
+-------------+      +-------------+
       |                    |
       +--(Retry/DLQ)-------+
```

## Funcionalidades Principais

*   **Entrega Garantida**: Pattern Transactional Outbox.
*   **Retry Inteligente**: Exponential Backoff + Jitter (até 24h).
*   **Concorrência Controlada**: Limite de requests simultâneos por endpoint.
*   **Proteção (Circuit Breaker)**: Pausa automática de endpoints instáveis.
*   **Segurança**:
    *   Assinatura HMAC-SHA256 (`X-Webhook-Signature`).
    *   **Rate Limit**: 100 req/min por Tenant (Bucket4j).
    *   **Payload Limit**: Máximo 1MB por evento.
    *   **Log Sanitization**: Mascaramento automático de secrets/tokens nos logs JSON.
*   **Observabilidade**: OpenTelemetry Tracing + Métricas Prometheus.
*   **Frontends**:
    *   **React**: Portal do Desenvolvedor.
    *   **Angular**: Console de Operações (OPS).

## Estrutura do Projeto

*   `/backend`: API Spring Boot (Java 17).
*   `/frontend-react`: Portal Dev (React + Vite).
*   `/frontend-angular`: Console OPS (Angular 19).
*   `/infra`: Docker Compose (Postgres, RabbitMQ, Otel, Redis).

## Como Rodar

### 1. Infraestrutura
```bash
cd infra
docker-compose up -d
```

### 2. Backend
```bash
cd backend
./mvnw spring-boot:run
```
API: `http://localhost:8080`

### 3. Frontends
*   **React (Dev)**: `cd frontend-react && npm run dev` (Port 5173)
*   **Angular (Ops)**: `cd frontend-angular && npm start` (Port 4200)

## Exemplos de Uso (Curl)

### 1. Login (Obter Token)
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@local", "password":"password"}' | jq -r .token)

echo $TOKEN
```

### 2. Criar Endpoint
```bash
curl -X POST http://localhost:8080/endpoints \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Meu Endpoint",
    "url": "https://webhook.site/uuid",
    "secret": "super-secret-key",
    "maxAttempts": 5,
    "timeoutMs": 5000,
    "concurrencyLimit": 2
  }'
```

### 3. Enviar Evento (Payload JSON)
```bash
curl -X POST http://localhost:8080/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "order.created",
    "payload": {
        "orderId": "12345",
        "amount": 99.90,
        "customer": "João Silva"
    }
  }'
```

## Detalhes de Implementação

### Validações e Limites
*   **Payload**: `@NotNull` e limite global de 1MB (`application.properties`).
*   **Rate Limit**: Header `X-Rate-Limit-Remaining` retornado. 429 Too Many Requests se excedido.
*   **Logs**: `logback-spring.xml` configurado para mascarar campos sensíveis (`secret`, `password`, `token`) usando Logstash Encoder.

### Testes
O projeto possui testes de integração E2E usando **Testcontainers** (Postgres + RabbitMQ).
```bash
cd backend
mvn test
```
Cobertura: Sucesso, Retry (500), DLQ, Dedupe.
