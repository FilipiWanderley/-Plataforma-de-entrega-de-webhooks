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
public class User {
  private UUID id;
  private UUID tenantId;
  private String email;
  private String passwordHash;
  private Role role;
  private LocalDateTime createdAt;
}
