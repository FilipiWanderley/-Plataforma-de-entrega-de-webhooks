package com.webhook.platform.application.consumer;

import com.webhook.platform.application.service.WebhookDeliveryService;
import com.webhook.platform.infra.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

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
            // If error persists, it might loop if we don't handle it.
            // But executeDelivery handles its own errors and updates job status.
            // Exceptions here would be DB connection errors, etc.
        }
    }
}
