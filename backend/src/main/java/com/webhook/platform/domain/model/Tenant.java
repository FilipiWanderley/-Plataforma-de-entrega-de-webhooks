package com.webhook.platform.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tenant {
  private UUID id;
  private String name;
  private String status; // ACTIVE, INACTIVE
  private LocalDateTime createdAt;
}
