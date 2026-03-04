package com.example.federebackend.controller;

import com.example.federebackend.dto.ProfileUpdateRequest;
import com.example.federebackend.dto.UtilisateurResponseDTO;
import com.example.federebackend.entity.Utilisateur;
import com.example.federebackend.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    /**
     * Get the current authenticated user's profile.
     * Works for Patient, Medecin, and Administrateur.
     * Returns type-specific fields (dateNaissance/telephone for Patient, specialite for Medecin).
     */
    @GetMapping
    public ResponseEntity<UtilisateurResponseDTO> getMyProfile(Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        UtilisateurResponseDTO profile = profileService.getProfile(utilisateur.getId());
        return ResponseEntity.ok(profile);
    }

    /**
     * Update the current authenticated user's profile.
     * Only updates fields matching the user's type.
     * Patient can update: nom, prenom, email, motDePasse, dateNaissance, telephone.
     * Medecin can update: nom, prenom, email, motDePasse, specialite.
     */
    @PutMapping
    public ResponseEntity<UtilisateurResponseDTO> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody ProfileUpdateRequest request) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        UtilisateurResponseDTO updated = profileService.updateProfile(utilisateur.getId(), request);
        return ResponseEntity.ok(updated);
    }
}
