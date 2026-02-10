package com.webhook.platform.application.repository;

import com.webhook.platform.domain.entity.*;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeadLetterRepository extends JpaRepository<DeadLetterEntity, UUID> {}
