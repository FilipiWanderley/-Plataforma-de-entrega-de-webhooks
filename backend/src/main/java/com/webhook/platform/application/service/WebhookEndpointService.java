package com.webhook.platform.application.service;

import com.webhook.platform.application.command.CreateEndpointCommand;
import com.webhook.platform.application.command.UpdateEndpointCommand;
import com.webhook.platform.application.repository.WebhookEndpointRepository;
import com.webhook.platform.domain.entity.WebhookEndpointEntity;
import com.webhook.platform.domain.model.EndpointStatus;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WebhookEndpointService {

  private final WebhookEndpointRepository repository;

  @Transactional(readOnly = true)
  public Page<WebhookEndpointEntity> listEndpoints(
      UUID tenantId, String status, Pageable pageable) {
    if (status != null && !status.isBlank()) {
      try {
        EndpointStatus enumStatus = EndpointStatus.valueOf(status);
        return repository.findByTenantIdAndStatus(tenantId, enumStatus, pageable);
      } catch (IllegalArgumentException e) {
        return Page.empty();
      }
    }
    return repository.findByTenantId(tenantId, pageable);
  }

  @Transactional
  public WebhookEndpointEntity createEndpoint(UUID tenantId, CreateEndpointCommand command) {
    WebhookEndpointEntity entity =
        WebhookEndpointEntity.builder()
            .tenantId(tenantId)
            .name(command.name())
            .url(command.url())
            .secret(command.secret())
            .status(EndpointStatus.ACTIVE)
            .maxAttempts(command.maxAttempts() != null ? command.maxAttempts() : 10)
            .timeoutMs(command.timeoutMs() != null ? command.timeoutMs() : 5000)
            .concurrencyLimit(command.concurrencyLimit() != null ? command.concurrencyLimit() : 2)
            .build();
    return repository.save(entity);
  }

  @Transactional
  public WebhookEndpointEntity updateEndpoint(
      UUID tenantId, UUID id, UpdateEndpointCommand command) {
    WebhookEndpointEntity entity =
        repository
            .findById(id)
            .filter(e -> e.getTenantId().equals(tenantId))
            .orElseThrow(() -> new RuntimeException("Endpoint not found"));

    if (command.name() != null) entity.setName(command.name());
    if (command.url() != null) entity.setUrl(command.url());
    if (command.status() != null) entity.setStatus(command.status());
    if (command.secret() != null) entity.setSecret(command.secret());
    if (command.maxAttempts() != null) entity.setMaxAttempts(command.maxAttempts());
    if (command.timeoutMs() != null) entity.setTimeoutMs(command.timeoutMs());
    if (command.concurrencyLimit() != null) entity.setConcurrencyLimit(command.concurrencyLimit());

    return repository.save(entity);
  }

  @Transactional
  public WebhookEndpointEntity getEndpoint(UUID tenantId, UUID id) {
    return repository
        .findById(id)
        .filter(e -> e.getTenantId().equals(tenantId))
        .orElseThrow(() -> new RuntimeException("Endpoint not found"));
  }

  // OPS only methods
  @Transactional
  public void blockEndpoint(UUID id) {
    WebhookEndpointEntity entity =
        repository.findById(id).orElseThrow(() -> new RuntimeException("Endpoint not found"));
    entity.setStatus(EndpointStatus.PAUSED);
    repository.save(entity);
  }
}
