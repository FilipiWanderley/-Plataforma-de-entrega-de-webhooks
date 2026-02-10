package com.webhook.platform.application.command;

import com.webhook.platform.domain.model.EndpointStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.hibernate.validator.constraints.URL;

public record UpdateEndpointCommand(
    String name,
    @URL String url,
    EndpointStatus status,
    String secret,
    @Min(1) @Max(20) Integer maxAttempts,
    @Min(100) @Max(60000) Integer timeoutMs,
    @Min(1) @Max(100) Integer concurrencyLimit) {}
