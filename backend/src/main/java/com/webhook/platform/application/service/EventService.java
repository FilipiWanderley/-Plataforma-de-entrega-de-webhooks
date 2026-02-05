package com.webhook.platform.application.service;

import com.webhook.platform.adapters.persistence.OutboxEventEntity;
import com.webhook.platform.adapters.persistence.OutboxEventRepository;
import com.webhook.platform.domain.model.EventStatus;
import io.micrometer.observation.annotation.Observed;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final OutboxEventRepository repository;

    @Transactional
    @Observed(name = "webhook.event.ingest", contextualName = "ingest-event")
    public UUID createEvent(UUID tenantId, String eventType, String payloadJson) {
        log.info("Receiving event {} for tenant {}", eventType, tenantId);
        
        OutboxEventEntity event = OutboxEventEntity.builder()
                .tenantId(tenantId)
                .eventType(eventType)
                .payloadJson(payloadJson)
                .status(EventStatus.PENDING)
                .build();
        
        event = repository.save(event);
        log.info("Event persisted with ID: {}", event.getId());
        
        return event.getId();
    }
}
