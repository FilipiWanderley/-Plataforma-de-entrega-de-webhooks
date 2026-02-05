package com.webhook.platform.application.service;

import com.webhook.platform.adapters.persistence.*;
import com.webhook.platform.domain.model.DeliveryStatus;
import com.webhook.platform.domain.model.EndpointStatus;
import com.webhook.platform.domain.policy.RetryPolicy;
import com.webhook.platform.domain.security.HmacUtils;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.observation.annotation.Observed;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

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
    private final MeterRegistry meterRegistry;

    public Page<DeliveryJobEntity> listJobs(UUID tenantId, DeliveryStatus status, Pageable pageable) {
        if (status != null) {
            return jobRepository.findByEndpointTenantIdAndStatus(tenantId, status, pageable);
        }
        return jobRepository.findByEndpointTenantId(tenantId, pageable);
    }

    public List<DeliveryAttemptEntity> listAttempts(UUID jobId) {
        return attemptRepository.findByDeliveryJobIdOrderByCreatedAtDesc(jobId);
    }

    public DeliveryJobEntity getJob(UUID id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Delivery Job not found with id: " + id));
    }

    @Observed(name = "webhook.delivery.process", contextualName = "process-event")
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

        // Circuit Breaker Check
        if (endpoint.getNextAvailableAt() != null && endpoint.getNextAvailableAt().isAfter(LocalDateTime.now())) {
            log.warn("Endpoint {} is paused due to Circuit Breaker until {}", endpoint.getId(), endpoint.getNextAvailableAt());
            // Create PENDING job scheduled for when CB opens
            createPendingJob(endpoint, event, endpoint.getNextAvailableAt());
            return;
        }

        // Concurrency Limit Check
        long currentInProgress = jobRepository.countByEndpointIdAndStatus(endpoint.getId(), DeliveryStatus.IN_PROGRESS);
        if (currentInProgress >= endpoint.getConcurrencyLimit()) {
            log.info("Concurrency limit reached for endpoint {} ({}/{}). Scheduling for later.", 
                    endpoint.getId(), currentInProgress, endpoint.getConcurrencyLimit());
            // Schedule with small delay (e.g. 10s) to back off
            createPendingJob(endpoint, event, LocalDateTime.now().plusSeconds(10));
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

    private void createPendingJob(WebhookEndpointEntity endpoint, OutboxEventEntity event, LocalDateTime nextAttemptAt) {
        DeliveryJobEntity job = DeliveryJobEntity.builder()
                .endpointId(endpoint.getId())
                .outboxEventId(event.getId())
                .status(DeliveryStatus.PENDING)
                .nextAttemptAt(nextAttemptAt)
                .attemptCount(0)
                .build();
        jobRepository.save(job);
    }

    @Observed(name = "webhook.delivery.attempt", contextualName = "execute-delivery")
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
            long timestamp = System.currentTimeMillis();
            String payload = event.getPayloadJson();
            String signature = HmacUtils.sign(timestamp + "." + payload, endpoint.getSecret());

            ResponseEntity<String> response = restClient.post()
                    .uri(endpoint.getUrl())
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Webhook-Event", event.getEventType())
                    .header("X-Webhook-Id", event.getId().toString())
                    .header("X-Webhook-Timestamp", String.valueOf(timestamp))
                    .header("X-Webhook-Signature", signature)
                    .header("User-Agent", "WebhookPlatform/1.0")
                    .body(payload)
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
            
            // Record Metrics
            Timer.builder("webhook.delivery.latency")
                    .tag("status", success ? "success" : "failure")
                    .tag("error", errorType != null ? errorType : "none")
                    .register(meterRegistry)
                    .record(duration, TimeUnit.MILLISECONDS);

            if (success) {
                meterRegistry.counter("webhook.delivery.success").increment();
            } else {
                meterRegistry.counter("webhook.delivery.failure", "reason", errorType).increment();
            }

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
                // Reset Circuit Breaker on success
                if (endpoint.getConsecutiveFailures() > 0) {
                    endpoint.setConsecutiveFailures(0);
                    endpoint.setNextAvailableAt(null);
                    endpoint.setFailureReason(null);
                    endpointRepository.save(endpoint);
                }

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
        // Increment Circuit Breaker Failures
        int failures = endpoint.getConsecutiveFailures() + 1;
        endpoint.setConsecutiveFailures(failures);
        
        if (failures >= endpoint.getCircuitBreakerThreshold()) {
            LocalDateTime pausedUntil = LocalDateTime.now().plusMinutes(5);
            endpoint.setNextAvailableAt(pausedUntil);
            endpoint.setFailureReason("Circuit Breaker Open: " + failures + " consecutive failures. Last error: " + (httpStatus != null ? httpStatus : exception));
            log.error("Circuit Breaker OPEN for endpoint {}. Paused until {}", endpoint.getId(), pausedUntil);
            meterRegistry.counter("webhook.circuit_breaker.open", "endpoint", endpoint.getId().toString()).increment();
        }
        endpointRepository.save(endpoint);

        boolean canRetry = retryPolicy.canRetry(httpStatus, exception);
        
        if (!canRetry) {
            job.setStatus(DeliveryStatus.FAILED);
            log.warn("Job {} failed with non-retryable error (Status: {}, Error: {}). Marking as FAILED.", 
                    job.getId(), httpStatus, exception != null ? exception.getMessage() : "Unknown");
            jobRepository.save(job);
            meterRegistry.counter("webhook.delivery.permanent_failure").increment();
            return;
        }

        meterRegistry.counter("webhook.delivery.retry").increment();

        if (job.getAttemptCount() >= endpoint.getMaxAttempts()) {
            job.setStatus(DeliveryStatus.DLQ);
            log.warn("Job {} failed after {} attempts. Moving to DLQ.", job.getId(), job.getAttemptCount());
            
            DeadLetterEntity deadLetter = DeadLetterEntity.builder()
                    .deliveryJobId(job.getId())
                    .reason("Max attempts reached: " + job.getAttemptCount() + ". Last error: " + (httpStatus != null ? httpStatus : exception))
                    .build();
            deadLetterRepository.save(deadLetter);
            meterRegistry.counter("webhook.dlq.events").increment();
            
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
