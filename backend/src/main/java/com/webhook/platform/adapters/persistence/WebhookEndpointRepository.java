package com.webhook.platform.adapters.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WebhookEndpointRepository extends JpaRepository<WebhookEndpointEntity, UUID> {
    Page<WebhookEndpointEntity> findByTenantId(UUID tenantId, Pageable pageable);
    Page<WebhookEndpointEntity> findByTenantIdAndStatus(UUID tenantId, String status, Pageable pageable);
    List<WebhookEndpointEntity> findByTenantIdAndStatus(UUID tenantId, String status);
}
