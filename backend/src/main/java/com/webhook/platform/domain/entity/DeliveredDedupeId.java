package com.webhook.platform.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveredDedupeId implements Serializable {
  @Column(name = "endpoint_id")
  private UUID endpointId;

  @Column(name = "outbox_event_id")
  private UUID outboxEventId;
}
