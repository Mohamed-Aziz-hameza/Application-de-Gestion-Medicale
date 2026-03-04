package com.example.federebackend.controller;

import com.example.federebackend.dto.*;
import com.example.federebackend.entity.Utilisateur;
import com.example.federebackend.service.ConsultationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consultations")
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationService consultationService;

    /**
     * Medecin creates a new consultation for a patient.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<ConsultationDTO> createConsultation(
            Authentication authentication,
            @Valid @RequestBody CreateConsultationRequest request) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        ConsultationDTO dto = consultationService.createConsultation(utilisateur.getId(), request);
        return ResponseEntity.ok(dto);
    }

    /**
     * Get all consultations for the authenticated medecin.
     */
    @GetMapping("/medecin")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<List<ConsultationDTO>> getMyConsultationsAsMedecin(Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(consultationService.getConsultationsByMedecin(utilisateur.getId()));
    }

    /**
     * Get all consultations for the authenticated patient.
     */
    @GetMapping("/patient")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<List<ConsultationDTO>> getMyConsultationsAsPatient(Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(consultationService.getConsultationsByPatient(utilisateur.getId()));
    }

    /**
     * Get a single consultation by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_MEDECIN', 'ROLE_PATIENT')")
    public ResponseEntity<ConsultationDTO> getConsultation(@PathVariable Long id) {
        return ResponseEntity.ok(consultationService.getConsultationById(id));
    }

    /**
     * Medecin updates a consultation.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<ConsultationDTO> updateConsultation(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody CreateConsultationRequest request) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(consultationService.updateConsultation(id, utilisateur.getId(), request));
    }

    /**
     * Medecin deletes a consultation.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<MessageResponse> deleteConsultation(
            @PathVariable Long id,
            Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        consultationService.deleteConsultation(id, utilisateur.getId());
        return ResponseEntity.ok(MessageResponse.builder().message("Consultation supprimée avec succès").build());
    }

    /**
     * Search consultations by type for the authenticated patient.
     */
    @GetMapping("/patient/search")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<List<ConsultationDTO>> searchConsultations(
            Authentication authentication,
            @RequestParam String type) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(consultationService.searchConsultations(utilisateur.getId(), type));
    }
}
