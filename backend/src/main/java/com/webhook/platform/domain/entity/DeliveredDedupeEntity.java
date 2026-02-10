package com.webhook.platform.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "delivered_dedupe")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveredDedupeEntity {

  @EmbeddedId private DeliveredDedupeId id;

  @CreationTimestamp
  @Column(name = "delivered_at", nullable = false, updatable = false)
  private LocalDateTime deliveredAt;
}
