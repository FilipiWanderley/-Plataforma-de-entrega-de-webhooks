package com.webhook.platform.application.port.out;

import java.util.Map;
import org.springframework.http.ResponseEntity;

public interface WebhookClient {
  ResponseEntity<String> post(String url, Map<String, String> headers, String body);
}
