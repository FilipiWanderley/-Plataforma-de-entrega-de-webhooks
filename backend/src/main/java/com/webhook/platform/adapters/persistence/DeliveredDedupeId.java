package com.webhook.platform.adapters.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

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
