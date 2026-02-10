package com.webhook.platform.adapters.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class EventDTOs {

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class CreateEventRequest {
    @NotBlank(message = "Event type is required")
    private String eventType;

    @jakarta.validation.constraints.NotNull(message = "Payload is required")
    private Object payload;
  }

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class EventResponse {
    private UUID id;
  }
}
