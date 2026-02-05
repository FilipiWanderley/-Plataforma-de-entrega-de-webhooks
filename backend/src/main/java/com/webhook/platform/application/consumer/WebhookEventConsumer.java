package com.webhook.platform.application.consumer;

import com.webhook.platform.adapters.persistence.OutboxEventEntity;
import com.webhook.platform.application.service.WebhookDeliveryService;
import com.webhook.platform.infra.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebhookEventConsumer {

    private final WebhookDeliveryService deliveryService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void receiveMessage(OutboxEventEntity event) {
        log.info("Received event from RabbitMQ: {}", event.getId());
        try {
            deliveryService.processEvent(event);
        } catch (Exception e) {
            log.error("Error processing event {}", event.getId(), e);
            // Throwing exception triggers RabbitMQ retry/DLQ based on policy
            // For now, we just log to avoid infinite loop if it's a code bug
            // In prod, use DLQ
        }
    }
}
