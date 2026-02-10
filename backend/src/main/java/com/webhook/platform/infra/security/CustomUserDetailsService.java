package com.webhook.platform.infra.security;

import com.webhook.platform.application.repository.UserRepository;
import com.webhook.platform.domain.entity.UserEntity;
import com.webhook.platform.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

  private final UserRepository userRepository;

  @Override
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
    UserEntity entity =
        userRepository
            .findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

    User user =
        User.builder()
            .id(entity.getId())
            .tenantId(entity.getTenantId())
            .email(entity.getEmail())
            .passwordHash(entity.getPasswordHash())
            .role(entity.getRole())
            .createdAt(entity.getCreatedAt())
            .build();

    return new SecurityUser(user);
  }
}
