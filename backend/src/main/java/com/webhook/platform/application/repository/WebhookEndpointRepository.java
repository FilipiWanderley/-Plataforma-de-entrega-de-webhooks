package com.webhook.platform.application.repository;

import com.webhook.platform.domain.entity.*;
import com.webhook.platform.domain.model.EndpointStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WebhookEndpointRepository extends JpaRepository<WebhookEndpointEntity, UUID> {
  Page<WebhookEndpointEntity> findByTenantId(UUID tenantId, Pageable pageable);

  Page<WebhookEndpointEntity> findByTenantIdAndStatus(
      UUID tenantId, EndpointStatus status, Pageable pageable);

  List<WebhookEndpointEntity> findByTenantIdAndStatus(UUID tenantId, EndpointStatus status);
}
