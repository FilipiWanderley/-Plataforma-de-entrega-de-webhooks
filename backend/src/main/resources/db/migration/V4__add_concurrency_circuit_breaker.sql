-- V4__add_concurrency_circuit_breaker.sql
ALTER TABLE webhook_endpoints ADD COLUMN consecutive_failures INT NOT NULL DEFAULT 0;
ALTER TABLE webhook_endpoints ADD COLUMN next_available_at TIMESTAMP;
ALTER TABLE webhook_endpoints ADD COLUMN failure_reason TEXT;
ALTER TABLE webhook_endpoints ADD COLUMN circuit_breaker_threshold INT NOT NULL DEFAULT 5;
