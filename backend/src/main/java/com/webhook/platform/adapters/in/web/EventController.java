package com.webhook.platform.adapters.in.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webhook.platform.adapters.in.web.dto.EventDTOs.CreateEventRequest;
import com.webhook.platform.adapters.in.web.dto.EventDTOs.EventResponse;
import com.webhook.platform.application.service.EventService;
import com.webhook.platform.domain.model.User;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class EventController {

  private final EventService service;
  private final ObjectMapper objectMapper;

  @PostMapping
  @SneakyThrows
  public ResponseEntity<EventResponse> create(
      @AuthenticationPrincipal User user, @Valid @RequestBody CreateEventRequest request) {

    String payloadJson =
        request.getPayload() instanceof String
            ? (String) request.getPayload()
            : objectMapper.writeValueAsString(request.getPayload());

    UUID eventId = service.createEvent(user.getTenantId(), request.getEventType(), payloadJson);

    return ResponseEntity.ok(new EventResponse(eventId));
  }
}
