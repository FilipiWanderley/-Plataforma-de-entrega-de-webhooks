package com.webhook.platform.application.repository;

import com.webhook.platform.domain.entity.*;
import com.webhook.platform.domain.model.DeliveryStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeliveryJobRepository extends JpaRepository<DeliveryJobEntity, UUID> {

  @Query(
      value =
          "SELECT * FROM delivery_jobs WHERE status IN ('PENDING') AND next_attempt_at <= :now ORDER BY next_attempt_at ASC LIMIT :limit FOR UPDATE SKIP LOCKED",
      nativeQuery = true)
  List<DeliveryJobEntity> findPendingJobsForUpdateSkipLocked(
      @Param("now") LocalDateTime now, @Param("limit") int limit);

  long countByEndpointIdAndStatus(UUID endpointId, DeliveryStatus status);

  Page<DeliveryJobEntity> findByStatus(DeliveryStatus status, Pageable pageable);

  Page<DeliveryJobEntity> findByEndpointTenantId(UUID tenantId, Pageable pageable);

  Page<DeliveryJobEntity> findByEndpointTenantIdAndStatus(
      UUID tenantId, DeliveryStatus status, Pageable pageable);

  long countByStatus(DeliveryStatus status);
}
