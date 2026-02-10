package com.webhook.platform.application.repository;

import com.webhook.platform.domain.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveredDedupeRepository
    extends JpaRepository<DeliveredDedupeEntity, DeliveredDedupeId> {}
