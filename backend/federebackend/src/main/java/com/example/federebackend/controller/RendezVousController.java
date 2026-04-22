package com.example.federebackend.controller;

import com.example.federebackend.dto.*;
import com.example.federebackend.entity.Utilisateur;
import com.example.federebackend.service.RendezVousService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rendez-vous")
@RequiredArgsConstructor
public class RendezVousController {

    private final RendezVousService rendezVousService;

    /**
     * Patient creates a rendez-vous request.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<RendezVousDTO> createRendezVous(
            Authentication authentication,
            @Valid @RequestBody CreateRendezVousRequest request) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        RendezVousDTO dto = rendezVousService.createRendezVous(utilisateur.getId(), request);
        return ResponseEntity.ok(dto);
    }

    /**
     * Get all rendez-vous for the authenticated patient.
     */
    @GetMapping("/patient")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<List<RendezVousDTO>> getMyRendezVousAsPatient(Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(rendezVousService.getRendezVousByPatient(utilisateur.getId()));
    }

    /**
     * Get all rendez-vous for the authenticated medecin.
     */
    @GetMapping("/medecin")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<List<RendezVousDTO>> getMyRendezVousAsMedecin(Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(rendezVousService.getRendezVousByMedecin(utilisateur.getId()));
    }

    /**
     * Get pending rendez-vous for medecin (notifications).
     */
    @GetMapping("/medecin/pending")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<List<RendezVousDTO>> getPendingRendezVous(Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(rendezVousService.getPendingForMedecin(utilisateur.getId()));
    }

    /**
     * Medecin confirms or rejects a rendez-vous.
     */
    @PutMapping("/{id}/statut")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<RendezVousDTO> updateRendezVousStatut(
            @PathVariable Long id,
            Authentication authentication,
            @RequestParam String statut) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(rendezVousService.updateStatut(id, utilisateur.getId(), statut));
    }

    /**
     * Medecin reschedules an existing rendez-vous to another available slot.
     */
    @PutMapping("/{id}/reschedule")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<RendezVousDTO> rescheduleRendezVous(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody RescheduleRendezVousRequest request) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(rendezVousService.rescheduleRendezVous(id, utilisateur.getId(), request.getDisponibiliteId()));
    }

    /**
     * Patient cancels a rendez-vous.
     */
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<RendezVousDTO> cancelRendezVous(
            @PathVariable Long id,
            Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(rendezVousService.cancelRendezVous(id, utilisateur.getId()));
    }

    /**
     * Medecin deletes a rendez-vous.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<MessageResponse> deleteRendezVous(
            @PathVariable Long id,
            Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        rendezVousService.deleteRendezVous(id, utilisateur.getId());
        return ResponseEntity.ok(MessageResponse.builder().message("Rendez-vous supprimé avec succès").build());
    }
}
