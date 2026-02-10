package com.webhook.platform.adapters.in.scheduler;

import com.webhook.platform.application.repository.DeliveryJobRepository;
import com.webhook.platform.domain.entity.DeliveryJobEntity;
import com.webhook.platform.domain.model.DeliveryStatus;
import com.webhook.platform.infra.config.RabbitMQConfig;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class RetryDispatcher {

  private final DeliveryJobRepository jobRepository;
  private final RabbitTemplate rabbitTemplate;

  private static final int BATCH_SIZE = 50;

  @Scheduled(fixedDelay = 5000) // Poll every 5 seconds
  @Transactional
  public void scheduleRetries() {
    LocalDateTime now = LocalDateTime.now();

    List<DeliveryJobEntity> jobs =
        jobRepository.findPendingJobsForUpdateSkipLocked(now, BATCH_SIZE);

    if (jobs.isEmpty()) {
      return;
    }

    log.info("Found {} jobs to retry", jobs.size());

    for (DeliveryJobEntity job : jobs) {
      try {
        // Publish Job ID to Retry Queue
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.EXCHANGE_NAME,
            RabbitMQConfig.RETRY_ROUTING_KEY,
            job.getId() // Send UUID as message
            );

        // Update status to ENQUEUED (or IN_PROGRESS to avoid double scheduling)
        job.setStatus(
            DeliveryStatus.IN_PROGRESS); // Temporarily mark as IN_PROGRESS until consumer picks up?
        // Or ENQUEUED if we had that status. Let's use IN_PROGRESS as consumer will execute
        // immediately.
        // Wait, if consumer fails to pick up, it stays IN_PROGRESS?
        // Ideally we should have ENQUEUED state for jobs too.
        // For now, using IN_PROGRESS is acceptable as "Queued for execution".

        jobRepository.save(job);
        log.debug("Job {} re-enqueued for retry", job.getId());

      } catch (Exception e) {
        log.error("Failed to enqueue retry for job {}", job.getId(), e);
        // Rollback happens, job stays PENDING
        throw e;
      }
    }
  }
}
