package com.webhook.platform;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.webhook.platform.application.repository.*;
import com.webhook.platform.application.service.WebhookDeliveryService;
import com.webhook.platform.domain.entity.*;
import com.webhook.platform.domain.model.DeliveryStatus;
import com.webhook.platform.domain.model.EndpointStatus;
import com.webhook.platform.domain.model.EventStatus;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@ActiveProfiles("test")
@TestPropertySource(properties = "spring.rabbitmq.listener.simple.auto-startup=false")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class DlqLogicTest {

  @Autowired WebhookDeliveryService deliveryService;
  @Autowired WebhookEndpointRepository endpointRepository;
  @Autowired OutboxEventRepository eventRepository;
  @Autowired DeliveryJobRepository jobRepository;
  @Autowired DeadLetterRepository deadLetterRepository;

  @MockBean RabbitTemplate rabbitTemplate;

  static WireMockServer wireMockServer;

  @BeforeAll
  static void startWireMock() {
    wireMockServer = new WireMockServer(0);
    wireMockServer.start();
    WireMock.configureFor(wireMockServer.port());
  }

  @AfterAll
  static void stopWireMock() {
    wireMockServer.stop();
  }

  @BeforeEach
  void reset() {
    wireMockServer.resetAll();
    jobRepository.deleteAll();
    eventRepository.deleteAll();
    endpointRepository.deleteAll();
    deadLetterRepository.deleteAll();
  }

  @Test
  void shouldMoveJobToDlq_WhenMaxAttemptsReached() {
    // Arrange
    String targetUrl = wireMockServer.baseUrl() + "/fail";
    stubFor(post(urlEqualTo("/fail")).willReturn(aResponse().withStatus(500)));

    WebhookEndpointEntity endpoint = createEndpoint(targetUrl);
    OutboxEventEntity event = createEvent(endpoint.getTenantId());

    // Act
    // MaxAttempts is 1. First attempt fails. Logic should move to DLQ.
    deliveryService.processEvent(event);

    // Assert
    List<DeliveryJobEntity> jobs = jobRepository.findAll();
    assertThat(jobs).hasSize(1);

    DeliveryJobEntity job = jobs.get(0);
    assertThat(job.getStatus())
        .as("Job should be in DLQ status after max attempts reached")
        .isEqualTo(DeliveryStatus.DLQ);

    assertThat(job.getAttemptCount()).isEqualTo(1);

    long dlqCount = deadLetterRepository.count();
    assertThat(dlqCount).as("Should have 1 entry in DeadLetter table").isEqualTo(1);
  }

  private WebhookEndpointEntity createEndpoint(String url) {
    return endpointRepository.save(
        WebhookEndpointEntity.builder()
            .tenantId(UUID.randomUUID())
            .name("DLQ Test Endpoint")
            .url(url)
            .status(EndpointStatus.ACTIVE)
            .secret("secret")
            .maxAttempts(1) // Critical for this test
            .timeoutMs(1000)
            .concurrencyLimit(5)
            .build());
  }

  private OutboxEventEntity createEvent(UUID tenantId) {
    return eventRepository.save(
        OutboxEventEntity.builder()
            .tenantId(tenantId)
            .eventType("TEST_EVENT")
            .payloadJson("{}")
            .status(EventStatus.PENDING)
            .build());
  }
}
