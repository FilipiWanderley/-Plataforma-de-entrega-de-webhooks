package com.webhook.platform.application.service;

import com.webhook.platform.application.port.out.TokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final AuthenticationManager authenticationManager;
  private final TokenProvider tokenProvider;

  public String login(String email, String password) {
    Authentication authenticate =
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, password));

    UserDetails userDetails = (UserDetails) authenticate.getPrincipal();
    return tokenProvider.generateToken(userDetails);
  }
}
