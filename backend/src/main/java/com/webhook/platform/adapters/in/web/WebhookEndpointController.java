package com.webhook.platform.adapters.in.web;

import com.webhook.platform.adapters.in.web.dto.WebhookEndpointDTOs.CreateEndpointRequest;
import com.webhook.platform.adapters.in.web.dto.WebhookEndpointDTOs.UpdateEndpointRequest;
import com.webhook.platform.adapters.in.web.dto.WebhookEndpointDTOs.WebhookEndpointResponse;
import com.webhook.platform.application.command.CreateEndpointCommand;
import com.webhook.platform.application.command.UpdateEndpointCommand;
import com.webhook.platform.application.service.WebhookEndpointService;
import com.webhook.platform.domain.entity.WebhookEndpointEntity;
import com.webhook.platform.domain.model.User;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/endpoints")
@RequiredArgsConstructor
public class WebhookEndpointController {

  private final WebhookEndpointService service;

  @GetMapping
  public ResponseEntity<Page<WebhookEndpointResponse>> list(
      @AuthenticationPrincipal User user,
      @RequestParam(required = false) String status,
      Pageable pageable) {

    Page<WebhookEndpointEntity> page = service.listEndpoints(user.getTenantId(), status, pageable);
    return ResponseEntity.ok(page.map(this::toResponse));
  }

  @PostMapping
  public ResponseEntity<WebhookEndpointResponse> create(
      @AuthenticationPrincipal User user, @Valid @RequestBody CreateEndpointRequest request) {

    CreateEndpointCommand command =
        new CreateEndpointCommand(
            request.name(),
            request.url(),
            request.secret(),
            request.maxAttempts(),
            request.timeoutMs(),
            request.concurrencyLimit());

    WebhookEndpointEntity entity = service.createEndpoint(user.getTenantId(), command);
    return ResponseEntity.ok(toResponse(entity));
  }

  @PutMapping("/{id}")
  public ResponseEntity<WebhookEndpointResponse> update(
      @AuthenticationPrincipal User user,
      @PathVariable UUID id,
      @Valid @RequestBody UpdateEndpointRequest request) {

    UpdateEndpointCommand command =
        new UpdateEndpointCommand(
            request.name(),
            request.url(),
            request.status(),
            request.secret(),
            request.maxAttempts(),
            request.timeoutMs(),
            request.concurrencyLimit());

    WebhookEndpointEntity entity = service.updateEndpoint(user.getTenantId(), id, command);
    return ResponseEntity.ok(toResponse(entity));
  }

  @GetMapping("/{id}")
  public ResponseEntity<WebhookEndpointResponse> get(
      @AuthenticationPrincipal User user, @PathVariable UUID id) {

    WebhookEndpointEntity entity = service.getEndpoint(user.getTenantId(), id);
    return ResponseEntity.ok(toResponse(entity));
  }

  // OPS only
  @PostMapping("/{id}/block")
  @PreAuthorize("hasRole('OPS')")
  public ResponseEntity<Void> block(@PathVariable UUID id) {
    service.blockEndpoint(id);
    return ResponseEntity.ok().build();
  }

  private WebhookEndpointResponse toResponse(WebhookEndpointEntity e) {
    return new WebhookEndpointResponse(
        e.getId(),
        e.getName(),
        e.getUrl(),
        e.getStatus(),
        e.getMaxAttempts(),
        e.getTimeoutMs(),
        e.getConcurrencyLimit(),
        e.getCreatedAt().toString());
  }
}
