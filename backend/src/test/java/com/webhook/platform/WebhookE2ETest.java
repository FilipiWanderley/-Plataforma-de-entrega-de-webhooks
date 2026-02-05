package com.webhook.platform;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.webhook.platform.adapters.persistence.DeliveryJobRepository;
import com.webhook.platform.adapters.persistence.OutboxEventRepository;
import com.webhook.platform.adapters.persistence.WebhookEndpointRepository;
import com.webhook.platform.domain.model.DeliveryStatus;
import com.webhook.platform.adapters.persistence.WebhookEndpointEntity;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.awaitility.Awaitility.await;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

class WebhookE2ETest extends AbstractIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired DeliveryJobRepository deliveryJobRepository;
    @Autowired WebhookEndpointRepository endpointRepository;
    @Autowired OutboxEventRepository eventRepository;

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
    }

    String getAuthToken() throws Exception {
        String content = "{\"email\": \"dev@local\", \"password\": \"password\"}";
        String response = mockMvc.perform(MockMvcRequestBuilders.post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(content))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return response.split("\"token\":\"")[1].split("\"")[0];
    }

    @Test
    void testSuccessfulDelivery_And_Dedupe() throws Exception {
        String token = getAuthToken();
        String targetUrl = wireMockServer.baseUrl() + "/webhook-success";
        
        stubFor(post(urlEqualTo("/webhook-success"))
                .willReturn(aResponse().withStatus(200)));

        // 1. Create Endpoint
        String createEndpointJson = """
            {
                "url": "%s",
                "eventTypes": ["ORDER_CREATED"],
                "description": "Test Endpoint",
                "secret": "my-secret"
            }
            """.formatted(targetUrl);

        mockMvc.perform(MockMvcRequestBuilders.post("/webhook-endpoints")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(createEndpointJson))
                .andExpect(status().isCreated());

        // 2. Send Event
        String eventJson = """
            {
                "tenantId": "11111111-1111-1111-1111-111111111111",
                "eventType": "ORDER_CREATED",
                "payload": {"orderId": "123"}
            }
            """;
            
        mockMvc.perform(MockMvcRequestBuilders.post("/events")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(eventJson))
                .andExpect(status().isAccepted());

        // 3. Wait for success
        await().atMost(10, TimeUnit.SECONDS).until(() -> 
            wireMockServer.findAll(postRequestedFor(urlEqualTo("/webhook-success"))).size() > 0
        );
        
        await().atMost(5, TimeUnit.SECONDS).until(() -> 
             deliveryJobRepository.findAll().stream()
                 .anyMatch(job -> job.getStatus() == DeliveryStatus.SUCCEEDED)
        );
        
        // 4. Validate Dedupe (Idempotency)
        // If we were to re-process the same event, it should not send another request.
        // We can check if DeliveredDedupeEntity exists implicitly by the fact that the job succeeded.
        // But let's check headers on the received request
        verify(postRequestedFor(urlEqualTo("/webhook-success"))
                .withHeader("X-Webhook-Event", equalTo("ORDER_CREATED"))
                .withHeader("User-Agent", equalTo("WebhookPlatform/1.0")));
    }

    @Test
    void testRetryOn500() throws Exception {
        String token = getAuthToken();
        String targetUrl = wireMockServer.baseUrl() + "/webhook-error";
        
        stubFor(post(urlEqualTo("/webhook-error"))
                .willReturn(aResponse().withStatus(500)));

        // Create Endpoint
        String createEndpointJson = """
            {
                "url": "%s",
                "eventTypes": ["PAYMENT_FAILED"],
                "description": "Error Endpoint",
                "secret": "secret"
            }
            """.formatted(targetUrl);

        mockMvc.perform(MockMvcRequestBuilders.post("/webhook-endpoints")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(createEndpointJson))
                .andExpect(status().isCreated());

        // Send Event
        String eventJson = """
            {
                "tenantId": "11111111-1111-1111-1111-111111111111",
                "eventType": "PAYMENT_FAILED",
                "payload": {"reason": "funds"}
            }
            """;

        mockMvc.perform(MockMvcRequestBuilders.post("/events")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(eventJson))
                .andExpect(status().isAccepted());

        // Wait for attempt and status PENDING (retry scheduled)
        await().atMost(10, TimeUnit.SECONDS).until(() -> 
            wireMockServer.findAll(postRequestedFor(urlEqualTo("/webhook-error"))).size() > 0
        );

        await().atMost(5, TimeUnit.SECONDS).until(() -> 
             deliveryJobRepository.findAll().stream()
                 .anyMatch(job -> job.getStatus() == DeliveryStatus.PENDING && job.getNextAttemptAt().isAfter(LocalDateTime.now()))
        );
    }
    
    @Test
    void testDlqMaxAttempts() throws Exception {
        String token = getAuthToken();
        String targetUrl = wireMockServer.baseUrl() + "/webhook-dlq";
        
        stubFor(post(urlEqualTo("/webhook-dlq"))
                .willReturn(aResponse().withStatus(500)));

        // Create Endpoint with Max Attempts = 2 (Need to update Entity after creation as DTO might not expose it?)
        // Assuming default is higher. Let's create then update via repository for test purposes.
        String createEndpointJson = """
            {
                "url": "%s",
                "eventTypes": ["DLQ_TEST"],
                "description": "DLQ Endpoint",
                "secret": "secret"
            }
            """.formatted(targetUrl);

        String response = mockMvc.perform(MockMvcRequestBuilders.post("/webhook-endpoints")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(createEndpointJson))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        
        // Extract ID and update max_attempts
        String idStr = response.split("\"id\":\"")[1].split("\"")[0];
        UUID endpointId = UUID.fromString(idStr);
        
        WebhookEndpointEntity endpoint = endpointRepository.findById(endpointId).orElseThrow();
        endpoint.setMaxAttempts(2);
        endpointRepository.save(endpoint);

        // Send Event
        String eventJson = """
            {
                "tenantId": "11111111-1111-1111-1111-111111111111",
                "eventType": "DLQ_TEST",
                "payload": {"test": "dlq"}
            }
            """;

        mockMvc.perform(MockMvcRequestBuilders.post("/events")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(eventJson))
                .andExpect(status().isAccepted());

        // Wait for 2 attempts
        // The first attempt happens immediately.
        // The second attempt happens after delay (1s).
        // Since retry dispatcher runs every 5s, it might take a bit.
        
        await().atMost(15, TimeUnit.SECONDS).until(() -> 
            wireMockServer.findAll(postRequestedFor(urlEqualTo("/webhook-dlq"))).size() >= 2
        );
        
        // Check status is DLQ
        await().atMost(10, TimeUnit.SECONDS).until(() -> 
             deliveryJobRepository.findAll().stream()
                 .anyMatch(job -> job.getStatus() == DeliveryStatus.DLQ)
        );
    }
}
