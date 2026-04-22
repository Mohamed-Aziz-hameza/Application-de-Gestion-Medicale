package com.example.federebackend.controller;

import com.example.federebackend.dto.*;
import com.example.federebackend.entity.TypeUtilisateur;
import com.example.federebackend.entity.Utilisateur;
import com.example.federebackend.service.AnalyseResultatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analyses")
@RequiredArgsConstructor
public class AnalyseResultatController {

    private final AnalyseResultatService analyseResultatService;

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<AnalyseResultatDTO> createAnalyse(
            Authentication authentication,
            @Valid @RequestBody CreateAnalyseResultatRequest request) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(analyseResultatService.createAnalyse(utilisateur.getId(), request));
    }

    @PostMapping("/ai")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<AnalyseResultatDTO> createAnalyseAvecAi(
            Authentication authentication,
            @Valid @RequestBody CreateAnalyseAvecAiRequest request) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(analyseResultatService.createAnalyseAvecAi(utilisateur.getId(), request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<AnalyseResultatDTO> updateAnalyse(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody UpdateAnalyseResultatRequest request) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(analyseResultatService.updateAnalyse(id, utilisateur.getId(), request));
    }

    @PutMapping("/{id}/approve-ai")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<AnalyseResultatDTO> approveAnalyseAi(
            @PathVariable Long id,
            Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(analyseResultatService.approveAnalyseAi(id, utilisateur.getId()));
    }

    @PostMapping("/{id}/timeline")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<AnalyseTimelineEventDTO> addTimelineEvent(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody AddAnalyseTimelineEventRequest request) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(analyseResultatService.addTimelineEvent(id, utilisateur.getId(), request));
    }

    @GetMapping("/medecin/me")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<List<AnalyseResultatDTO>> getMyAnalysesAsMedecin(Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(analyseResultatService.getMedecinAnalyses(utilisateur.getId()));
    }

    @GetMapping("/patient/me")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<List<AnalyseResultatDTO>> getMyAnalysesAsPatient(Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(analyseResultatService.getPatientAnalyses(utilisateur.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_MEDECIN', 'ROLE_PATIENT', 'ROLE_ADMIN')")
    public ResponseEntity<AnalyseResultatDTO> getAnalyseById(@PathVariable Long id, Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();

        if (utilisateur.getTypeUtilisateur() == TypeUtilisateur.Administrateur) {
            return ResponseEntity.ok(analyseResultatService.getAnalyseForAdmin(id));
        }

        if (utilisateur.getTypeUtilisateur() == TypeUtilisateur.Medecin) {
            return ResponseEntity.ok(analyseResultatService.getAnalyseForMedecin(id, utilisateur.getId()));
        }

        return ResponseEntity.ok(analyseResultatService.getAnalyseForPatient(id, utilisateur.getId()));
    }
}
