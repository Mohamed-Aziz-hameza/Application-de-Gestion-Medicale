package com.example.federebackend.controller;

import com.example.federebackend.dto.*;
import com.example.federebackend.service.AdminService;
import com.example.federebackend.service.DossierMedicalService;
import com.example.federebackend.service.NotificationService;
import com.example.federebackend.service.AnalyseResultatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final DossierMedicalService dossierMedicalService;
    private final NotificationService notificationService;
    private final AnalyseResultatService analyseResultatService;

    /**
     * Activate a user account.
     */
    @PutMapping("/activate/{utilisateurId}")
    public ResponseEntity<MessageResponse> activateAccount(@PathVariable Long utilisateurId) {
        String msg = adminService.activateAccount(utilisateurId);
        return ResponseEntity.ok(MessageResponse.builder().message(msg).build());
    }

    /**
     * Deactivate a user account.
     */
    @PutMapping("/deactivate/{utilisateurId}")
    public ResponseEntity<MessageResponse> deactivateAccount(@PathVariable Long utilisateurId) {
        String msg = adminService.deactivateAccount(utilisateurId);
        return ResponseEntity.ok(MessageResponse.builder().message(msg).build());
    }

    /**
     * Get all users.
     */
    @GetMapping("/utilisateurs")
    public ResponseEntity<List<UtilisateurResponseDTO>> getAllUtilisateurs() {
        return ResponseEntity.ok(adminService.getAllUtilisateurs());
    }

    /**
     * Get a single user by ID.
     */
    @GetMapping("/utilisateurs/{id}")
    public ResponseEntity<UtilisateurResponseDTO> getUtilisateurById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUtilisateurById(id));
    }

    /**
     * Get all medical dossiers.
     */
    @GetMapping("/dossiers")
    public ResponseEntity<List<DossierMedicalDTO>> getAllDossiers() {
        return ResponseEntity.ok(dossierMedicalService.getAllDossiers());
    }

    /**
     * Get all notifications (admin audit).
     */
    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDTO>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllForAdmin());
    }

    /**
     * Get all analyses and results in the system.
     */
    @GetMapping("/analyses")
    public ResponseEntity<List<AnalyseResultatDTO>> getAllAnalyses() {
        return ResponseEntity.ok(analyseResultatService.getAllAnalysesForAdmin());
    }
}
