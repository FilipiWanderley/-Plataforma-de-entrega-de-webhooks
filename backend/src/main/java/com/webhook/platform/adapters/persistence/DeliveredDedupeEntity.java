package com.webhook.platform.adapters.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "delivered_dedupe")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveredDedupeEntity {

    @EmbeddedId
    private DeliveredDedupeId id;

    @CreationTimestamp
    @Column(name = "delivered_at", nullable = false, updatable = false)
    private LocalDateTime deliveredAt;
}
