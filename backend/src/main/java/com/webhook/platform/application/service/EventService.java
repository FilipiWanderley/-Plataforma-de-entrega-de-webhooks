package com.webhook.platform.application.service;

import com.webhook.platform.adapters.persistence.OutboxEventEntity;
import com.webhook.platform.adapters.persistence.OutboxEventRepository;
import com.webhook.platform.domain.model.EventStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private final OutboxEventRepository repository;

    @Transactional
    public UUID createEvent(UUID tenantId, String eventType, String payload) {
        OutboxEventEntity event = OutboxEventEntity.builder()
                .tenantId(tenantId)
                .eventType(eventType)
                .payloadJson(payload)
                .status(EventStatus.PENDING)
                .build();

        OutboxEventEntity savedEvent = repository.save(event);
        return savedEvent.getId();
    }
}
