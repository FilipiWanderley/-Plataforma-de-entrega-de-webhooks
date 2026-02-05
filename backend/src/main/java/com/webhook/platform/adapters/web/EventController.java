package com.webhook.platform.adapters.web;

import com.webhook.platform.adapters.web.dto.EventDTOs.CreateEventRequest;
import com.webhook.platform.adapters.web.dto.EventDTOs.EventResponse;
import com.webhook.platform.application.service.EventService;
import com.webhook.platform.domain.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService service;

    @PostMapping
    public ResponseEntity<EventResponse> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateEventRequest request) {
        
        UUID eventId = service.createEvent(
                user.getTenantId(),
                request.getEventType(),
                request.getPayload()
        );
        
        return ResponseEntity.ok(new EventResponse(eventId));
    }
}
