package com.webhook.platform.adapters.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveredDedupeRepository extends JpaRepository<DeliveredDedupeEntity, DeliveredDedupeId> {
}
