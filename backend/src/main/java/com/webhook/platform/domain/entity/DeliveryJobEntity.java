package com.webhook.platform.domain.entity;

import com.webhook.platform.domain.model.DeliveryStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "delivery_jobs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryJobEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "endpoint_id", nullable = false)
  private UUID endpointId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "endpoint_id", insertable = false, updatable = false)
  private WebhookEndpointEntity endpoint;

  @Column(name = "outbox_event_id", nullable = false)
  private UUID outboxEventId;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private DeliveryStatus status;

  @Column(name = "next_attempt_at")
  private LocalDateTime nextAttemptAt;

  @Column(name = "attempt_count", nullable = false)
  @Builder.Default
  private Integer attemptCount = 0;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
