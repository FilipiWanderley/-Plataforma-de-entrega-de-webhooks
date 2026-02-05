package com.webhook.platform.adapters.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DeliveryJobRepository extends JpaRepository<DeliveryJobEntity, UUID> {
    
    @Query(value = "SELECT * FROM delivery_jobs WHERE status = 'PENDING' AND next_attempt_at <= :now ORDER BY next_attempt_at ASC LIMIT :limit FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<DeliveryJobEntity> findPendingJobsForUpdateSkipLocked(@Param("now") LocalDateTime now, @Param("limit") int limit);

    Page<DeliveryJobEntity> findByStatus(String status, Pageable pageable);
}
