package com.webhook.platform.adapters.persistence;

import com.webhook.platform.domain.model.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface DeliveryJobRepository extends JpaRepository<DeliveryJobEntity, UUID> {
    
    @Query(value = "SELECT * FROM delivery_jobs WHERE status IN (:statuses) AND next_attempt_at <= NOW() ORDER BY next_attempt_at ASC LIMIT :limit FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<DeliveryJobEntity> findRetryJobs(@Param("statuses") List<String> statuses, @Param("limit") int limit);

    long countByEndpointIdAndStatus(UUID endpointId, DeliveryStatus status);
}
