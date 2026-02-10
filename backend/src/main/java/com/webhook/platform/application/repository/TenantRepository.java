package com.webhook.platform.application.repository;

import com.webhook.platform.domain.entity.*;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository extends JpaRepository<TenantEntity, UUID> {}
