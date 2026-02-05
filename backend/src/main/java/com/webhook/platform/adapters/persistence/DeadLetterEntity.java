package com.webhook.platform.adapters.persistence;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "dead_letters")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeadLetterEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "delivery_job_id", nullable = false)
    private UUID deliveryJobId;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
