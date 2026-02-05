package com.webhook.platform.application.service;

import com.webhook.platform.adapters.persistence.*;
import com.webhook.platform.domain.model.DeliveryStatus;
import com.webhook.platform.domain.model.EndpointStatus;
import com.webhook.platform.domain.policy.RetryPolicy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookDeliveryService {

    private final WebhookEndpointRepository endpointRepository;
    private final DeliveryJobRepository jobRepository;
    private final DeliveryAttemptRepository attemptRepository;
    private final DeliveredDedupeRepository dedupeRepository;
    private final OutboxEventRepository eventRepository;
    private final DeadLetterRepository deadLetterRepository;
    private final RetryPolicy retryPolicy;
    private final RestClient restClient = RestClient.create();

    public void processEvent(OutboxEventEntity event) {
        log.info("Processing event {} for tenant {}", event.getId(), event.getTenantId());

        // 1. Resolve Active Endpoints
        List<WebhookEndpointEntity> endpoints = endpointRepository.findByTenantIdAndStatus(
                event.getTenantId(), EndpointStatus.ACTIVE.name()
        );

        if (endpoints.isEmpty()) {
            log.info("No active endpoints for tenant {}", event.getTenantId());
            return;
        }

        // 2. Process each endpoint
        for (WebhookEndpointEntity endpoint : endpoints) {
            processEndpointDelivery(event, endpoint);
        }
    }

    private void processEndpointDelivery(OutboxEventEntity event, WebhookEndpointEntity endpoint) {
        // Idempotency Check
        DeliveredDedupeId dedupeId = new DeliveredDedupeId(endpoint.getId(), event.getId());
        if (dedupeRepository.existsById(dedupeId)) {
            log.info("Event {} already delivered to endpoint {}", event.getId(), endpoint.getId());
            return;
        }

        // Create Job
        DeliveryJobEntity job = DeliveryJobEntity.builder()
                .endpointId(endpoint.getId())
                .outboxEventId(event.getId())
                .status(DeliveryStatus.IN_PROGRESS)
                .attemptCount(0)
                .build();
        job = jobRepository.save(job);

        // Execute Delivery
        executeDelivery(job, endpoint, event);
    }

    private void executeDelivery(DeliveryJobEntity job, WebhookEndpointEntity endpoint, OutboxEventEntity event) {
        long start = System.currentTimeMillis();
        int attemptNo = job.getAttemptCount() + 1;
        
        job.setAttemptCount(attemptNo);
        
        Integer httpStatus = null;
        String errorType = null;
        String responseSnippet = null;
        boolean success = false;
        Throwable exception = null;

        try {
            ResponseEntity<String> response = restClient.post()
                    .uri(endpoint.getUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Webhook-Event", event.getEventType())
                    .header("X-Webhook-ID", event.getId().toString())
                    // TODO: Add HMAC signature here
                    .body(event.getPayloadJson())
                    .retrieve()
                    .toEntity(String.class);

            httpStatus = response.getStatusCode().value();
            responseSnippet = response.getBody();
            if (responseSnippet != null && responseSnippet.length() > 200) {
                responseSnippet = responseSnippet.substring(0, 200);
            }

            if (response.getStatusCode().is2xxSuccessful()) {
                success = true;
            } else {
                errorType = retryPolicy.determineErrorType(httpStatus, null);
            }

        } catch (Exception e) {
            exception = e;
            errorType = retryPolicy.determineErrorType(null, e);
            responseSnippet = e.getMessage();
            if (responseSnippet != null && responseSnippet.length() > 200) {
                responseSnippet = responseSnippet.substring(0, 200);
            }
        } finally {
            long duration = System.currentTimeMillis() - start;

            // Record Attempt
            DeliveryAttemptEntity attempt = DeliveryAttemptEntity.builder()
                    .deliveryJobId(job.getId())
                    .attemptNo(attemptNo)
                    .httpStatus(httpStatus)
                    .errorType(errorType)
                    .durationMs(duration)
                    .responseSnippet(responseSnippet)
                    .build();
            attemptRepository.save(attempt);

            // Update Job Status
            if (success) {
                job.setStatus(DeliveryStatus.SUCCEEDED);
                jobRepository.save(job);
                
                // Save Dedupe
                DeliveredDedupeEntity dedupe = DeliveredDedupeEntity.builder()
                        .id(new DeliveredDedupeId(endpoint.getId(), event.getId()))
                        .build();
                dedupeRepository.save(dedupe);
                
                log.info("Delivery success for job {}", job.getId());
            } else {
                handleFailure(job, endpoint, httpStatus, exception);
            }
        }
    }

    private void handleFailure(DeliveryJobEntity job, WebhookEndpointEntity endpoint, Integer httpStatus, Throwable exception) {
        boolean canRetry = retryPolicy.canRetry(httpStatus, exception);
        
        if (!canRetry) {
            job.setStatus(DeliveryStatus.FAILED);
            log.warn("Job {} failed with non-retryable error (Status: {}, Error: {}). Marking as FAILED.", 
                    job.getId(), httpStatus, exception != null ? exception.getMessage() : "Unknown");
            jobRepository.save(job);
            return;
        }

        if (job.getAttemptCount() >= endpoint.getMaxAttempts()) {
            job.setStatus(DeliveryStatus.DLQ);
            log.warn("Job {} failed after {} attempts. Moving to DLQ.", job.getId(), job.getAttemptCount());
            
            DeadLetterEntity deadLetter = DeadLetterEntity.builder()
                    .deliveryJobId(job.getId())
                    .reason("Max attempts reached: " + job.getAttemptCount() + ". Last error: " + (httpStatus != null ? httpStatus : exception))
                    .build();
            deadLetterRepository.save(deadLetter);
            
        } else {
            // Calculate Next Attempt with Policy
            long delaySeconds = retryPolicy.calculateDelaySeconds(job.getAttemptCount());
            job.setNextAttemptAt(LocalDateTime.now().plusSeconds(delaySeconds));
            job.setStatus(DeliveryStatus.PENDING); // Will be picked up by a retry poller
            log.info("Job {} scheduled for retry at {} (Delay: {}s)", job.getId(), job.getNextAttemptAt(), delaySeconds);
        }
        jobRepository.save(job);
    }

    public void retryJob(java.util.UUID jobId) {
        DeliveryJobEntity job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        // Sanity check: Should be IN_PROGRESS (marked by dispatcher) or PENDING
        
        WebhookEndpointEntity endpoint = endpointRepository.findById(job.getEndpointId())
                .orElseThrow(() -> new IllegalStateException("Endpoint not found for job " + jobId));

        OutboxEventEntity event = eventRepository.findById(job.getOutboxEventId())
                .orElseThrow(() -> new IllegalStateException("Event not found for job " + jobId));

        executeDelivery(job, endpoint, event);
    }
}
