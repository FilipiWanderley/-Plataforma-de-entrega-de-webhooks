package com.webhook.platform.adapters.web;

import com.webhook.platform.adapters.persistence.DeliveryJobEntity;
import com.webhook.platform.adapters.persistence.DeliveryJobRepository;
import com.webhook.platform.domain.model.DeliveryStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/dlq")
@RequiredArgsConstructor
public class DlqController {

    private final DeliveryJobRepository jobRepository;

    @GetMapping
    @PreAuthorize("hasRole('OPS')")
    public ResponseEntity<Page<DeliveryJobEntity>> listDlq(Pageable pageable) {
        Page<DeliveryJobEntity> page = jobRepository.findByStatus(DeliveryStatus.DLQ, pageable);
        return ResponseEntity.ok(page);
    }

    @PostMapping("/{id}/replay")
    @PreAuthorize("hasRole('OPS')")
    public ResponseEntity<Void> replay(@PathVariable UUID id) {
        DeliveryJobEntity job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Job not found"));

        if (job.getStatus() != DeliveryStatus.DLQ) {
            return ResponseEntity.badRequest().build();
        }

        // Reset job for retry
        job.setStatus(DeliveryStatus.PENDING);
        job.setNextAttemptAt(LocalDateTime.now());
        // Optional: Reset attempt count? Or keep history?
        // Usually replay implies "give it another shot", so we might want to increase max attempts logic or reset count.
        // Let's reset count to 0 to allow full retry cycle.
        job.setAttemptCount(0); 
        
        jobRepository.save(job);
        
        return ResponseEntity.ok().build();
    }
}
