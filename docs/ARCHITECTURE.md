# Architecture & Design

## System Overview

The Webhook Delivery Platform is designed to provide reliable, at-least-once delivery of webhooks to external endpoints. It decouples event ingestion from delivery using the Transactional Outbox pattern and an asynchronous worker queue.

### Core Components

1.  **Ingestion API (REST)**
    - Accepts events from internal systems.
    - Validates payloads (max 1MB).
    - Persists event + outbox entry in a single transaction.

2.  **Transactional Outbox**
    - `outbox_events` table acts as a reliable queue within the database.
    - Guarantees no event is lost even if the message broker is temporarily down during ingestion.

3.  **Dispatcher (Poller)**
    - Periodically polls `outbox_events`.
    - Publishes events to RabbitMQ (`webhook.delivery.exchange`).
    - Deletes/Marks outbox entries upon successful publish.

4.  **Delivery Worker (Consumer)**
    - Consumes messages from RabbitMQ.
    - Executes HTTP POST requests to registered endpoints.
    - Handles retries with exponential backoff.
    - Manages concurrency limits per tenant/endpoint.

5.  **Dead Letter Queue (DLQ)**
    - Events exceeding max retries are moved to a DLQ table/queue.
    - Allows manual inspection and replay via the Ops Console.

## Data Flow

```mermaid
sequenceDiagram
    participant Client
    participant API as Ingestion API
    participant DB as PostgreSQL (Outbox)
    participant Dispatcher
    participant RMQ as RabbitMQ
    participant Worker as Delivery Worker
    participant Ext as External Endpoint

    Client->>API: POST /events
    API->>DB: INSERT Event + Outbox (Tx)
    API-->>Client: 202 Accepted

    loop Polling
        Dispatcher->>DB: SELECT * FROM outbox
        Dispatcher->>RMQ: Publish Event
        Dispatcher->>DB: DELETE FROM outbox
    end

    RMQ->>Worker: Consume Event
    Worker->>Ext: POST Webhook (HMAC Signed)
    
    alt Success
        Ext-->>Worker: 200 OK
        Worker->>DB: Update Status (DELIVERED)
    else Failure
        Ext-->>Worker: 5xx / Timeout
        Worker->>RMQ: Nack + Requeue (Backoff)
    end
```

## Delivery Semantics

- **At-Least-Once Delivery**: We guarantee the webhook will be delivered, but in rare network partition scenarios, it might be delivered more than once.
- **Idempotency**: Clients should handle duplicate deliveries using the `Webhook-ID` header.
- **Ordering**: Strict ordering is **not** guaranteed to maximize throughput, though rudimentary sequencing is preserved via the Outbox.

## Security

- **HMAC Signatures**: All outgoing webhooks are signed with HMAC-SHA256 using a shared secret.
- **Rate Limiting**: Token bucket algorithm (Bucket4j) enforces limits per tenant.
- **Circuit Breaker**: Endpoints with high failure rates are temporarily "tripped" to prevent resource exhaustion.
