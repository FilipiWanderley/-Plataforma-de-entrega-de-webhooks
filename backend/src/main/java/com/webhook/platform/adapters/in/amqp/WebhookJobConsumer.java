package com.webhook.platform.adapters.in.amqp;

import com.webhook.platform.application.service.WebhookDeliveryService;
import com.webhook.platform.infra.config.RabbitMQConfig;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebhookJobConsumer {

  private final WebhookDeliveryService deliveryService;

  @RabbitListener(queues = RabbitMQConfig.RETRY_QUEUE_NAME)
  public void retryJob(UUID jobId) {
    log.info("Received retry job: {}", jobId);
    try {
      deliveryService.retryJob(jobId);
    } catch (Exception e) {
      log.error("Error processing retry job {}", jobId, e);
      // Uncaught exceptions will trigger RabbitMQ's default retry/DLQ behavior.
    }
  }
}
