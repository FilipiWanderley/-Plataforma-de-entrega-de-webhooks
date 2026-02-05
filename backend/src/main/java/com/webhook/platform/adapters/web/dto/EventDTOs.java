package com.webhook.platform.adapters.web.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

public class EventDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateEventRequest {
        @NotBlank(message = "Event type is required")
        private String eventType;

        @NotBlank(message = "Payload is required")
        private String payload;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventResponse {
        private UUID id;
    }
}
