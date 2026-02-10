package com.webhook.platform.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "delivery_attempts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryAttemptEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "delivery_job_id", nullable = false)
  private UUID deliveryJobId;

  @Column(name = "attempt_no", nullable = false)
  private Integer attemptNo;

  @Column(name = "http_status")
  private Integer httpStatus;

  @Column(name = "error_type")
  private String errorType;

  @Column(name = "duration_ms")
  private Long durationMs;

  @Column(name = "response_snippet", columnDefinition = "TEXT")
  private String responseSnippet;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
