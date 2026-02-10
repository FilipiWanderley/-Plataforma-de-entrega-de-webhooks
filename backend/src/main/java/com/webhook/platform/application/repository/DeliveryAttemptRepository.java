package com.webhook.platform.application.repository;

import com.webhook.platform.domain.entity.*;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveryAttemptRepository extends JpaRepository<DeliveryAttemptEntity, UUID> {
  List<DeliveryAttemptEntity> findByDeliveryJobIdOrderByCreatedAtDesc(UUID deliveryJobId);
}
