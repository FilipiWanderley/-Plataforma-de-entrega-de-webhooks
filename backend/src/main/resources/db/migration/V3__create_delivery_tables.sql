-- Webhook Endpoints
CREATE TABLE webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    status VARCHAR(50) NOT NULL, -- ACTIVE, PAUSED
    secret VARCHAR(255) NOT NULL,
    max_attempts INT NOT NULL DEFAULT 10,
    timeout_ms INT NOT NULL DEFAULT 5000,
    concurrency_limit INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_endpoint_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Outbox Events (Durability)
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    payload_json TEXT NOT NULL,
    status VARCHAR(50) NOT NULL, -- PENDING, ENQUEUED, PUBLISHED
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    published_at TIMESTAMP,
    CONSTRAINT fk_outbox_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Delivery Jobs (Tracking processing status)
CREATE TABLE delivery_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint_id UUID NOT NULL,
    outbox_event_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL, -- PENDING, IN_PROGRESS, SUCCEEDED, FAILED, DLQ
    next_attempt_at TIMESTAMP,
    attempt_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_job_endpoint FOREIGN KEY (endpoint_id) REFERENCES webhook_endpoints(id),
    CONSTRAINT fk_job_event FOREIGN KEY (outbox_event_id) REFERENCES outbox_events(id)
);

-- Delivery Attempts (History)
CREATE TABLE delivery_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_job_id UUID NOT NULL,
    attempt_no INT NOT NULL,
    http_status INT,
    error_type VARCHAR(255),
    duration_ms BIGINT,
    response_snippet TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_attempt_job FOREIGN KEY (delivery_job_id) REFERENCES delivery_jobs(id)
);

-- Dead Letters (Final failure state)
CREATE TABLE dead_letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_job_id UUID NOT NULL,
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_dlq_job FOREIGN KEY (delivery_job_id) REFERENCES delivery_jobs(id)
);

-- Dedupe (Idempotency control)
CREATE TABLE delivered_dedupe (
    endpoint_id UUID NOT NULL,
    outbox_event_id UUID NOT NULL,
    delivered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (endpoint_id, outbox_event_id),
    CONSTRAINT fk_dedupe_endpoint FOREIGN KEY (endpoint_id) REFERENCES webhook_endpoints(id),
    CONSTRAINT fk_dedupe_event FOREIGN KEY (outbox_event_id) REFERENCES outbox_events(id)
);

-- Indexes
CREATE INDEX idx_outbox_status_created ON outbox_events(status, created_at);
CREATE INDEX idx_jobs_endpoint_next_attempt ON delivery_jobs(endpoint_id, next_attempt_at);
CREATE INDEX idx_attempts_job_attempt_desc ON delivery_attempts(delivery_job_id, attempt_no DESC);
