package com.webhook.platform.application.dispatcher;

import com.webhook.platform.adapters.persistence.OutboxEventEntity;
import com.webhook.platform.adapters.persistence.OutboxEventRepository;
import com.webhook.platform.domain.model.EventStatus;
import com.webhook.platform.infra.config.RabbitMQConfig;
import io.micrometer.observation.annotation.Observed;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxDispatcher {

    private final OutboxEventRepository repository;
    private final RabbitTemplate rabbitTemplate;

    private static final int BATCH_SIZE = 50;

    @Scheduled(fixedDelay = 1000)
    @Transactional
    @Observed(name = "webhook.dispatcher.process", contextualName = "dispatch-outbox")
    public void processOutbox() {
        List<OutboxEventEntity> events = repository.findBatchByStatusForUpdateSkipLocked(
                EventStatus.PENDING.name(), BATCH_SIZE
        );

        if (events.isEmpty()) {
            return;
        }

        log.info("Found {} pending events to process", events.size());

        for (OutboxEventEntity event : events) {
            try {
                rabbitTemplate.convertAndSend(
                        RabbitMQConfig.EXCHANGE_NAME,
                        RabbitMQConfig.ROUTING_KEY,
                        event
                );

                event.setStatus(EventStatus.ENQUEUED);
                repository.save(event);
                
                log.debug("Event {} enqueued successfully", event.getId());
            } catch (Exception e) {
                // Transaction rollback ensures event remains PENDING for retry.
                log.error("Failed to publish event {}. Transaction will rollback.", event.getId(), e);
                throw e;
            }
        }
    }
}
