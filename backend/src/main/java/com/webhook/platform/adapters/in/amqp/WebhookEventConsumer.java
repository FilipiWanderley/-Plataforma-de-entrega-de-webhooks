package com.webhook.platform.adapters.in.amqp;

import com.webhook.platform.application.service.WebhookDeliveryService;
import com.webhook.platform.domain.entity.OutboxEventEntity;
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
    deliveryService.processEvent(event);
  }
}
