package com.webhook.platform.application.command;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;

public record CreateEndpointCommand(
    @NotBlank String name,
    @NotBlank @URL String url,
    @NotBlank String secret,
    @Min(1) @Max(20) Integer maxAttempts,
    @Min(100) @Max(60000) Integer timeoutMs,
    @Min(1) @Max(100) Integer concurrencyLimit) {}
