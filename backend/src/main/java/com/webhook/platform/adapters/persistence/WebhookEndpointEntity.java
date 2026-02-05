package com.webhook.platform.adapters.persistence;

import com.webhook.platform.domain.model.EndpointStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "webhook_endpoints")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookEndpointEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EndpointStatus status;

    @Column(nullable = false)
    private String secret;

    @Column(name = "max_attempts", nullable = false)
    private Integer maxAttempts;

    @Column(name = "timeout_ms", nullable = false)
    private Integer timeoutMs;

    @Column(name = "concurrency_limit", nullable = false)
    private Integer concurrencyLimit;

    @Column(name = "consecutive_failures", nullable = false)
    @Builder.Default
    private Integer consecutiveFailures = 0;

    @Column(name = "next_available_at")
    private LocalDateTime nextAvailableAt;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "circuit_breaker_threshold", nullable = false)
    @Builder.Default
    private Integer circuitBreakerThreshold = 5;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
