package com.webhook.platform.adapters.out.http;

import com.webhook.platform.application.port.out.WebhookClient;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class SpringWebhookClient implements WebhookClient {

  private final RestClient restClient = RestClient.create();

  @Override
  public ResponseEntity<String> post(String url, Map<String, String> headers, String body) {
    return restClient
        .post()
        .uri(url)
        .contentType(MediaType.APPLICATION_JSON)
        .headers(h -> headers.forEach(h::add))
        .body(body)
        .retrieve()
        .toEntity(String.class);
  }
}
