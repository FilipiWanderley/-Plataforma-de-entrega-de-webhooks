package com.webhook.platform.application.service;

import com.webhook.platform.adapters.persistence.WebhookEndpointEntity;
import com.webhook.platform.adapters.persistence.WebhookEndpointRepository;
import com.webhook.platform.adapters.web.dto.WebhookEndpointDTOs.CreateEndpointRequest;
import com.webhook.platform.adapters.web.dto.WebhookEndpointDTOs.UpdateEndpointRequest;
import com.webhook.platform.domain.model.EndpointStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WebhookEndpointService {

    private final WebhookEndpointRepository repository;

    @Transactional(readOnly = true)
    public Page<WebhookEndpointEntity> listEndpoints(UUID tenantId, String status, Pageable pageable) {
        if (status != null && !status.isBlank()) {
            return repository.findByTenantIdAndStatus(tenantId, status, pageable);
        }
        return repository.findByTenantId(tenantId, pageable);
    }

    @Transactional
    public WebhookEndpointEntity createEndpoint(UUID tenantId, CreateEndpointRequest request) {
        WebhookEndpointEntity entity = WebhookEndpointEntity.builder()
                .tenantId(tenantId)
                .name(request.name())
                .url(request.url())
                .secret(request.secret())
                .status(EndpointStatus.ACTIVE)
                .maxAttempts(request.maxAttempts() != null ? request.maxAttempts() : 10)
                .timeoutMs(request.timeoutMs() != null ? request.timeoutMs() : 5000)
                .concurrencyLimit(request.concurrencyLimit() != null ? request.concurrencyLimit() : 2)
                .build();
        return repository.save(entity);
    }

    @Transactional
    public WebhookEndpointEntity updateEndpoint(UUID tenantId, UUID id, UpdateEndpointRequest request) {
        WebhookEndpointEntity entity = repository.findById(id)
                .filter(e -> e.getTenantId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("Endpoint not found"));

        if (request.name() != null) entity.setName(request.name());
        if (request.url() != null) entity.setUrl(request.url());
        if (request.status() != null) entity.setStatus(request.status());
        if (request.secret() != null) entity.setSecret(request.secret());
        if (request.maxAttempts() != null) entity.setMaxAttempts(request.maxAttempts());
        if (request.timeoutMs() != null) entity.setTimeoutMs(request.timeoutMs());
        if (request.concurrencyLimit() != null) entity.setConcurrencyLimit(request.concurrencyLimit());

        return repository.save(entity);
    }

    @Transactional
    public WebhookEndpointEntity getEndpoint(UUID tenantId, UUID id) {
        return repository.findById(id)
                .filter(e -> e.getTenantId().equals(tenantId))
                .orElseThrow(() -> new RuntimeException("Endpoint not found"));
    }

    // OPS only methods
    @Transactional
    public void blockEndpoint(UUID id) {
        WebhookEndpointEntity entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Endpoint not found"));
        entity.setStatus(EndpointStatus.PAUSED);
        repository.save(entity);
    }
}
