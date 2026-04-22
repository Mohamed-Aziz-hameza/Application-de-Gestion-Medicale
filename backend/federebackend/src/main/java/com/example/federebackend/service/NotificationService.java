package com.example.federebackend.service;

import com.example.federebackend.dto.NotificationDTO;
import com.example.federebackend.entity.Notification;
import com.example.federebackend.entity.Utilisateur;
import com.example.federebackend.repository.NotificationRepository;
import com.example.federebackend.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional
    public void createNotification(Long utilisateurId, String titre, String message, String type) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        Notification notification = new Notification();
        notification.setUtilisateur(utilisateur);
        notification.setTitre(titre);
        notification.setMessage(message);
        notification.setType(type != null ? type : "GENERAL");
        notification.setLu(false);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getMyNotifications(Long utilisateurId) {
        return notificationRepository.findByUtilisateurIdOrderByCreatedAtDesc(utilisateurId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getUnreadCount(Long utilisateurId) {
        long count = notificationRepository.countByUtilisateurIdAndLuFalse(utilisateurId);
        return Map.of("unread", count);
    }

    @Transactional
    public Map<String, Long> markAllAsRead(Long utilisateurId) {
        List<Notification> unread = notificationRepository.findByUtilisateurIdAndLuFalseOrderByCreatedAtDesc(utilisateurId);
        unread.forEach(notification -> notification.setLu(true));
        notificationRepository.saveAll(unread);

        return Map.of("updated", (long) unread.size());
    }

    @Transactional
    public NotificationDTO markAsRead(Long notificationId, Long utilisateurId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification introuvable"));

        if (!notification.getUtilisateur().getId().equals(utilisateurId)) {
            throw new RuntimeException("Vous n'etes pas autorise a modifier cette notification");
        }

        notification.setLu(true);
        notification = notificationRepository.save(notification);
        return toDTO(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getAllForAdmin() {
        return notificationRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .titre(n.getTitre())
                .message(n.getMessage())
                .type(n.getType())
                .lu(n.isLu())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
