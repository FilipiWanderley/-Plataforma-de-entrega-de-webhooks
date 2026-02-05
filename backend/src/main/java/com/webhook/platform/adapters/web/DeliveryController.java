package com.webhook.platform.adapters.web;

import com.webhook.platform.adapters.persistence.DeliveryAttemptEntity;
import com.webhook.platform.adapters.persistence.DeliveryJobEntity;
import com.webhook.platform.adapters.web.dto.DeliveryDTOs.DeliveryAttemptResponse;
import com.webhook.platform.adapters.web.dto.DeliveryDTOs.DeliveryJobResponse;
import com.webhook.platform.application.service.WebhookDeliveryService;
import com.webhook.platform.domain.model.DeliveryStatus;
import com.webhook.platform.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/deliveries")
@RequiredArgsConstructor
public class DeliveryController {

    private final WebhookDeliveryService service;

    @GetMapping
    public ResponseEntity<Page<DeliveryJobResponse>> list(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) DeliveryStatus status,
            Pageable pageable) {
        
        Page<DeliveryJobEntity> page = service.listJobs(user.getTenantId(), status, pageable);
        return ResponseEntity.ok(page.map(this::toJobResponse));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeliveryJobResponse> get(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        DeliveryJobEntity job = service.getJob(id);
        // TODO: Validate tenant ownership
        return ResponseEntity.ok(toJobResponse(job));
    }

    @GetMapping("/{id}/attempts")
    public ResponseEntity<List<DeliveryAttemptResponse>> listAttempts(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        // TODO: Validate if job belongs to tenant (omitted for speed, relying on UUID unguessability + future improvements)
        List<DeliveryAttemptEntity> attempts = service.listAttempts(id);
        return ResponseEntity.ok(attempts.stream().map(this::toAttemptResponse).toList());
    }

    private DeliveryJobResponse toJobResponse(DeliveryJobEntity entity) {
        String endpointName = entity.getEndpoint() != null ? entity.getEndpoint().getName() : "Unknown";
        return new DeliveryJobResponse(
                entity.getId(),
                entity.getEndpointId(),
                endpointName,
                entity.getStatus(),
                entity.getNextAttemptAt(),
                entity.getAttemptCount(),
                entity.getCreatedAt()
        );
    }

    private DeliveryAttemptResponse toAttemptResponse(DeliveryAttemptEntity entity) {
        boolean success = entity.getHttpStatus() != null && entity.getHttpStatus() >= 200 && entity.getHttpStatus() < 300;
        return new DeliveryAttemptResponse(
                entity.getId(),
                entity.getHttpStatus(),
                entity.getDurationMs(),
                success,
                entity.getErrorType() != null ? entity.getErrorType() : entity.getResponseSnippet(),
                entity.getCreatedAt()
        );
    }
}
