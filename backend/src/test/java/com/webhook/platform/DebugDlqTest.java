package com.webhook.platform;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.webhook.platform.application.repository.*;
import com.webhook.platform.domain.entity.*;
import com.webhook.platform.domain.model.DeliveryStatus;
import com.webhook.platform.domain.model.Role;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

class DebugDlqTest extends AbstractIntegrationTest {

  @Autowired MockMvc mockMvc;
  @Autowired DeliveryJobRepository deliveryJobRepository;
  @Autowired WebhookEndpointRepository endpointRepository;
  @Autowired OutboxEventRepository eventRepository;
  @Autowired UserRepository userRepository;
  @Autowired TenantRepository tenantRepository;
  @Autowired PasswordEncoder passwordEncoder;

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
    deliveryJobRepository.deleteAll();
    eventRepository.deleteAll();
    endpointRepository.deleteAll();

    // Ensure Tenant and User exist (Seed data might be wiped or modified by other tests)
    if (tenantRepository.count() == 0) {
      TenantEntity tenant =
          TenantEntity.builder()
              .id(UUID.fromString("11111111-1111-1111-1111-111111111111"))
              .name("Default Tenant")
              .status("ACTIVE")
              .build();
      tenantRepository.save(tenant);
    }

    if (userRepository.findByEmail("dev@local").isEmpty()) {
      UserEntity user =
          UserEntity.builder()
              .tenantId(UUID.fromString("11111111-1111-1111-1111-111111111111"))
              .email("dev@local")
              .passwordHash(passwordEncoder.encode("password"))
              .role(Role.DEV)
              .build();
      userRepository.save(user);
    }
  }

  String getAuthToken() throws Exception {
    String content = "{\"email\": \"dev@local\", \"password\": \"password\"}";
    String response =
        mockMvc
            .perform(
                MockMvcRequestBuilders.post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(content))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return response.split("\"token\":\"")[1].split("\"")[0];
  }

  @Test
  void debugDlqFlow() throws Exception {
    System.out.println(">>> STARTING DEBUG TEST <<<");
    String token = getAuthToken();
    String targetUrl = wireMockServer.baseUrl() + "/webhook-fail-now";

    stubFor(post(urlEqualTo("/webhook-fail-now")).willReturn(aResponse().withStatus(500)));

    // 1. Create Endpoint
    String createEndpointJson =
        """
            {
                "name": "Debug Endpoint",
                "url": "%s",
                "secret": "secret",
                "maxAttempts": 1
            }
            """
            .formatted(targetUrl);

    String response =
        mockMvc
            .perform(
                MockMvcRequestBuilders.post("/endpoints")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(createEndpointJson))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

    String idStr = response.split("\"id\":\"")[1].split("\"")[0];
    UUID endpointId = UUID.fromString(idStr);
    System.out.println(">>> Endpoint Created: " + endpointId);

    // Verify Endpoint in DB
    WebhookEndpointEntity endpoint = endpointRepository.findById(endpointId).orElseThrow();
    System.out.println(
        ">>> Endpoint DB State: Tenant="
            + endpoint.getTenantId()
            + ", MaxAttempts="
            + endpoint.getMaxAttempts());

    // 2. Create Event
    String eventJson =
        """
            {
                "eventType": "DEBUG_EVENT",
                "payload": {"foo": "bar"}
            }
            """;

    mockMvc
        .perform(
            MockMvcRequestBuilders.post("/events")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(eventJson))
        .andExpect(status().isAccepted()); // 202 Accepted
    System.out.println(">>> Event Created via API");

    // 3. Wait and Debug
    System.out.println(">>> Waiting for processing...");

    try {
      await()
          .atMost(10, TimeUnit.SECONDS)
          .until(
              () -> {
                List<DeliveryJobEntity> jobs = deliveryJobRepository.findAll();
                System.out.println(">>> Checking jobs... count=" + jobs.size());
                if (!jobs.isEmpty()) {
                  DeliveryJobEntity job = jobs.get(0);
                  System.out.println(
                      ">>> Job Found: Status="
                          + job.getStatus()
                          + ", Attempts="
                          + job.getAttemptCount());
                  return job.getStatus() == DeliveryStatus.DLQ;
                }

                List<OutboxEventEntity> events = eventRepository.findAll();
                if (!events.isEmpty()) {
                  System.out.println(">>> Event Status: " + events.get(0).getStatus());
                }

                return false;
              });
      System.out.println(">>> SUCCESS: Job moved to DLQ");
    } catch (Exception e) {
      System.out.println(">>> TIMEOUT or FAILURE <<<");
      System.out.println(">>> DUMPING STATE <<<");

      System.out.println("--- EVENTS ---");
      eventRepository.findAll().forEach(ev -> System.out.println(ev));

      System.out.println("--- ENDPOINTS ---");
      endpointRepository.findAll().forEach(ep -> System.out.println(ep));

      System.out.println("--- JOBS ---");
      deliveryJobRepository.findAll().forEach(j -> System.out.println(j));

      throw e;
    }
  }
}
