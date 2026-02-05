package com.webhook.platform.adapters.web;

import com.webhook.platform.adapters.persistence.WebhookEndpointEntity;
import com.webhook.platform.adapters.web.dto.WebhookEndpointDTOs.CreateEndpointRequest;
import com.webhook.platform.adapters.web.dto.WebhookEndpointDTOs.UpdateEndpointRequest;
import com.webhook.platform.adapters.web.dto.WebhookEndpointDTOs.WebhookEndpointResponse;
import com.webhook.platform.application.service.WebhookEndpointService;
import com.webhook.platform.domain.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

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
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateEndpointRequest request) {
        
        WebhookEndpointEntity entity = service.createEndpoint(user.getTenantId(), request);
        return ResponseEntity.ok(toResponse(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WebhookEndpointResponse> update(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEndpointRequest request) {
        
        WebhookEndpointEntity entity = service.updateEndpoint(user.getTenantId(), id, request);
        return ResponseEntity.ok(toResponse(entity));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WebhookEndpointResponse> get(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        
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
                e.getCreatedAt().toString()
        );
    }
}
