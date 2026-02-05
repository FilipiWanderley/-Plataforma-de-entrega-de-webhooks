package com.webhook.platform.adapters.web.dto;

import com.webhook.platform.domain.model.EndpointStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.hibernate.validator.constraints.URL;

import java.util.UUID;

public class WebhookEndpointDTOs {

    public record CreateEndpointRequest(
            @NotBlank String name,
            @NotBlank @URL String url,
            @NotBlank String secret,
            @Min(1) @Max(20) Integer maxAttempts,
            @Min(100) @Max(60000) Integer timeoutMs,
            @Min(1) @Max(100) Integer concurrencyLimit
    ) {}

    public record UpdateEndpointRequest(
            String name,
            @URL String url,
            EndpointStatus status,
            String secret,
            @Min(1) @Max(20) Integer maxAttempts,
            @Min(100) @Max(60000) Integer timeoutMs,
            @Min(1) @Max(100) Integer concurrencyLimit
    ) {}

    public record WebhookEndpointResponse(
            UUID id,
            String name,
            String url,
            EndpointStatus status,
            Integer maxAttempts,
            Integer timeoutMs,
            Integer concurrencyLimit,
            String createdAt
    ) {}
}
