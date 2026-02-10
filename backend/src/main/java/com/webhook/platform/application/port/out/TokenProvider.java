package com.webhook.platform.application.port.out;

import org.springframework.security.core.userdetails.UserDetails;

public interface TokenProvider {
  String generateToken(UserDetails userDetails);
}
