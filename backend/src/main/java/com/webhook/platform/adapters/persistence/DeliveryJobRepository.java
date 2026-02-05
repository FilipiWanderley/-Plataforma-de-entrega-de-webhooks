package com.webhook.platform.adapters.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DeliveryJobRepository extends JpaRepository<DeliveryJobEntity, UUID> {
}
