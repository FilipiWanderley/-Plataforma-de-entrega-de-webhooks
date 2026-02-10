package com.webhook.platform.application.repository;

import com.webhook.platform.domain.entity.*;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEventEntity, UUID> {

  @Query(
      value =
          "SELECT * FROM outbox_events WHERE status = :status ORDER BY created_at ASC LIMIT :limit FOR UPDATE SKIP LOCKED",
      nativeQuery = true)
  List<OutboxEventEntity> findBatchByStatusForUpdateSkipLocked(
      @Param("status") String status, @Param("limit") int limit);
}
