package com.webhook.platform.infra.config;

import com.webhook.platform.domain.policy.RetryPolicy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DomainConfig {

  @Bean
  public RetryPolicy retryPolicy() {
    return new RetryPolicy();
  }
}
