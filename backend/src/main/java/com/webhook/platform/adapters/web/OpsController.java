package com.webhook.platform.adapters.web;

import com.webhook.platform.adapters.persistence.DeliveryJobRepository;
import com.webhook.platform.adapters.web.dto.OpsDTOs.DashboardMetrics;
import com.webhook.platform.domain.model.DeliveryStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ops")
@RequiredArgsConstructor
public class OpsController {

    private final DeliveryJobRepository jobRepository;

    @GetMapping("/metrics")
    @PreAuthorize("hasRole('OPS')")
    public ResponseEntity<DashboardMetrics> getMetrics() {
        long pending = jobRepository.countByStatus(DeliveryStatus.PENDING);
        long success = jobRepository.countByStatus(DeliveryStatus.SUCCESS);
        long failed = jobRepository.countByStatus(DeliveryStatus.FAILED);
        long dlq = jobRepository.countByStatus(DeliveryStatus.DLQ);
        long processing = jobRepository.countByStatus(DeliveryStatus.PROCESSING);

        return ResponseEntity.ok(new DashboardMetrics(pending, success, failed, dlq, processing));
    }
}
