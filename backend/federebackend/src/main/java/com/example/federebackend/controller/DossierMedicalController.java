package com.example.federebackend.controller;

import com.example.federebackend.dto.*;
import com.example.federebackend.entity.Utilisateur;
import com.example.federebackend.service.DossierMedicalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/dossier-medical")
@RequiredArgsConstructor
public class DossierMedicalController {

    private final DossierMedicalService dossierMedicalService;

    /**
     * Medecin creates a dossier medical for a patient.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<DossierMedicalDTO> createDossierMedical(
            @Valid @RequestBody CreateDossierMedicalRequest request) {
        DossierMedicalDTO dto = dossierMedicalService.createDossierMedical(request);
        return ResponseEntity.ok(dto);
    }

    /**
     * Get dossier medical for a specific patient (Medecin access).
     */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<DossierMedicalDTO> getDossierByPatientId(@PathVariable Long patientId) {
        return ResponseEntity.ok(dossierMedicalService.getDossierByPatientId(patientId));
    }

    /**
     * Patient views their own dossier medical.
     */
    @GetMapping("/me")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<DossierMedicalDTO> getMyDossier(Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(dossierMedicalService.getDossierByPatientId(utilisateur.getId()));
    }

    /**
     * Medecin updates a dossier medical.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<DossierMedicalDTO> updateDossierMedical(
            @PathVariable String id,
            @Valid @RequestBody CreateDossierMedicalRequest request) {
        return ResponseEntity.ok(dossierMedicalService.updateDossierMedical(id, request));
    }

    /**
     * Upload medical images directly from local PC into MongoDB.
     */
    @PostMapping(value = "/{id}/images", consumes = "multipart/form-data")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<DossierMedicalDTO> uploadImages(
            @PathVariable String id,
            @RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.ok(dossierMedicalService.uploadImages(id, files));
    }

    /**
     * Delete one uploaded image from dossier.
     */
    @DeleteMapping("/{id}/images/{imageId}")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<DossierMedicalDTO> deleteImage(
            @PathVariable String id,
            @PathVariable String imageId) {
        return ResponseEntity.ok(dossierMedicalService.deleteImage(id, imageId));
    }

    /**
     * Medecin deletes a dossier medical.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<MessageResponse> deleteDossierMedical(@PathVariable String id) {
        dossierMedicalService.deleteDossierMedical(id);
        return ResponseEntity.ok(MessageResponse.builder().message("Dossier médical supprimé avec succès").build());
    }

    /**
     * Get all dossier medical records (Medecin access).
     */
    @GetMapping("/all")
    @PreAuthorize("hasAnyAuthority('ROLE_MEDECIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<DossierMedicalDTO>> getAllDossiers() {
        return ResponseEntity.ok(dossierMedicalService.getAllDossiers());
    }
}
