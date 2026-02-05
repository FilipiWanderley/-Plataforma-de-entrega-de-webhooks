package com.webhook.platform.adapters.web.dto;

import com.webhook.platform.domain.model.DeliveryStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public class DeliveryDTOs {

    public record DeliveryJobResponse(
            UUID id,
            UUID endpointId,
            String endpointName,
            DeliveryStatus status,
            LocalDateTime nextAttemptAt,
            Integer attemptCount,
            LocalDateTime createdAt
    ) {}

    public record DeliveryAttemptResponse(
            UUID id,
            Integer responseCode,
            Long durationMs,
            Boolean success,
            String errorMessage,
            LocalDateTime createdAt
    ) {}
}
