package com.example.federebackend.repository;

import com.example.federebackend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUtilisateurIdOrderByCreatedAtDesc(Long utilisateurId);

    List<Notification> findByUtilisateurIdAndLuFalseOrderByCreatedAtDesc(Long utilisateurId);

    long countByUtilisateurIdAndLuFalse(Long utilisateurId);
}
