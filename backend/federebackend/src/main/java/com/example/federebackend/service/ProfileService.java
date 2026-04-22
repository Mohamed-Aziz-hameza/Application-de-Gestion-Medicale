package com.example.federebackend.service;

import com.example.federebackend.dto.ProfileUpdateRequest;
import com.example.federebackend.dto.UtilisateurResponseDTO;
import com.example.federebackend.entity.*;
import com.example.federebackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UtilisateurRepository utilisateurRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Get the profile of the currently authenticated user.
     * Returns common fields + type-specific fields (Patient or Medecin).
     */
    public UtilisateurResponseDTO getProfile(Long utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        return mapToResponse(utilisateur);
    }

    /**
     * Update the profile of the currently authenticated user.
     * Only updates fields matching their type (Patient or Medecin).
     */
    @Transactional
    public UtilisateurResponseDTO updateProfile(Long utilisateurId, ProfileUpdateRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Check email uniqueness if changed
        if (request.getEmail() != null && !request.getEmail().isBlank()
                && !utilisateur.getEmail().equals(request.getEmail())) {
            if (utilisateurRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Cet email est déjà utilisé");
            }
            utilisateur.setEmail(request.getEmail());
        }

        // Update common fields if provided
        if (request.getNom() != null && !request.getNom().isBlank()) {
            utilisateur.setNom(request.getNom());
        }
        if (request.getPrenom() != null && !request.getPrenom().isBlank()) {
            utilisateur.setPrenom(request.getPrenom());
        }

        // Update password only if provided
        if (request.getMotDePasse() != null && !request.getMotDePasse().isEmpty()) {
            utilisateur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        }

        // Update type-specific fields
        switch (utilisateur.getTypeUtilisateur()) {
            case Patient -> {
                Patient patient = patientRepository.findById(utilisateurId)
                        .orElse(null);
                if (patient != null) {
                    if (request.getDateNaissance() != null && !request.getDateNaissance().isEmpty()) {
                        patient.setDateNaissance(LocalDate.parse(request.getDateNaissance()));
                    }
                    if (request.getTelephone() != null) {
                        patient.setTelephone(request.getTelephone());
                    }
                    patientRepository.save(patient);
                }
            }
            case Medecin -> {
                Medecin medecin = medecinRepository.findById(utilisateurId)
                        .orElse(null);
                if (medecin != null) {
                    if (request.getSpecialite() != null) {
                        medecin.setSpecialite(request.getSpecialite());
                    }
                    medecinRepository.save(medecin);
                }
            }
            case Administrateur -> {
                // No extra fields for admin
            }
        }

        utilisateur = utilisateurRepository.save(utilisateur);
        return mapToResponse(utilisateur);
    }

    /**
     * Maps a Utilisateur entity + its type-specific data to UtilisateurResponseDTO.
     */
    private UtilisateurResponseDTO mapToResponse(Utilisateur utilisateur) {
        UtilisateurResponseDTO.UtilisateurResponseDTOBuilder builder = UtilisateurResponseDTO.builder()
                .id(utilisateur.getId())
                .nom(utilisateur.getNom())
                .prenom(utilisateur.getPrenom())
                .email(utilisateur.getEmail())
                .typeUtilisateur(utilisateur.getTypeUtilisateur())
                .statusCompte(utilisateur.getStatusCompte().getLibelle());

        // Add type-specific fields
        switch (utilisateur.getTypeUtilisateur()) {
            case Patient -> {
                Patient patient = patientRepository.findById(utilisateur.getId()).orElse(null);
                if (patient != null) {
                    if (patient.getDateNaissance() != null) {
                        builder.dateNaissance(patient.getDateNaissance().toString());
                    }
                    builder.telephone(patient.getTelephone());
                }
            }
            case Medecin -> {
                Medecin medecin = medecinRepository.findById(utilisateur.getId()).orElse(null);
                if (medecin != null) {
                    builder.specialite(medecin.getSpecialite());
                }
            }
            case Administrateur -> {
                // No extra fields
            }
        }

        return builder.build();
    }
}
