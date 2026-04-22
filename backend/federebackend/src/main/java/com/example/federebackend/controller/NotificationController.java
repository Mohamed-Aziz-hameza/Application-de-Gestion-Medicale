package com.example.federebackend.controller;

import com.example.federebackend.dto.NotificationDTO;
import com.example.federebackend.entity.Utilisateur;
import com.example.federebackend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/me")
    @PreAuthorize("hasAnyAuthority('ROLE_MEDECIN','ROLE_PATIENT','ROLE_ADMIN')")
    public ResponseEntity<List<NotificationDTO>> getMyNotifications(Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(notificationService.getMyNotifications(utilisateur.getId()));
    }

    @GetMapping("/me/unread-count")
    @PreAuthorize("hasAnyAuthority('ROLE_MEDECIN','ROLE_PATIENT','ROLE_ADMIN')")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(notificationService.getUnreadCount(utilisateur.getId()));
    }

    @PutMapping("/me/read-all")
    @PreAuthorize("hasAnyAuthority('ROLE_MEDECIN','ROLE_PATIENT','ROLE_ADMIN')")
    public ResponseEntity<Map<String, Long>> markAllRead(Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(notificationService.markAllAsRead(utilisateur.getId()));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasAnyAuthority('ROLE_MEDECIN','ROLE_PATIENT','ROLE_ADMIN')")
    public ResponseEntity<NotificationDTO> markRead(@PathVariable Long id, Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(notificationService.markAsRead(id, utilisateur.getId()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<NotificationDTO>> getAllForAdmin() {
        return ResponseEntity.ok(notificationService.getAllForAdmin());
    }
}
