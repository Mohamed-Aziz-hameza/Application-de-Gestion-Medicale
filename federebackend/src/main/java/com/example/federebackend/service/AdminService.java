package com.example.federebackend.service;

import com.example.federebackend.dto.UtilisateurResponseDTO;
import com.example.federebackend.entity.*;
import com.example.federebackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UtilisateurRepository utilisateurRepository;
    private final StatusCompteRepository statusCompteRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;

    /**
     * Activate a user account (statusCompte_id = 1).
     */
    @Transactional
    public String activateAccount(Long utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        StatusCompte statusActive = statusCompteRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Status compte introuvable"));

        utilisateur.setStatusCompte(statusActive);
        utilisateurRepository.save(utilisateur);

        return "Compte activé avec succès pour " + utilisateur.getNom() + " " + utilisateur.getPrenom();
    }

    /**
     * Deactivate a user account (statusCompte_id = 2).
     */
    @Transactional
    public String deactivateAccount(Long utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        StatusCompte statusDesactive = statusCompteRepository.findById(2L)
                .orElseThrow(() -> new RuntimeException("Status compte introuvable"));

        utilisateur.setStatusCompte(statusDesactive);
        utilisateurRepository.save(utilisateur);

        return "Compte désactivé avec succès pour " + utilisateur.getNom() + " " + utilisateur.getPrenom();
    }

    /**
     * Get all utilisateurs as DTOs with patient/medecin-specific fields.
     */
    public List<UtilisateurResponseDTO> getAllUtilisateurs() {
        return utilisateurRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a single utilisateur by ID as DTO.
     */
    public UtilisateurResponseDTO getUtilisateurById(Long id) {
        Utilisateur u = utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return toDTO(u);
    }

    private UtilisateurResponseDTO toDTO(Utilisateur u) {
        UtilisateurResponseDTO.UtilisateurResponseDTOBuilder builder = UtilisateurResponseDTO.builder()
                .id(u.getId())
                .nom(u.getNom())
                .prenom(u.getPrenom())
                .email(u.getEmail())
                .typeUtilisateur(u.getTypeUtilisateur())
                .statusCompte(u.getStatusCompte() != null ? u.getStatusCompte().getLibelle() : null);

        if (u.getTypeUtilisateur() == TypeUtilisateur.Patient) {
            patientRepository.findById(u.getId()).ifPresent(p -> {
                builder.telephone(p.getTelephone());
                builder.dateNaissance(p.getDateNaissance() != null ? p.getDateNaissance().toString() : null);
            });
        } else if (u.getTypeUtilisateur() == TypeUtilisateur.Medecin) {
            medecinRepository.findById(u.getId()).ifPresent(m -> {
                builder.specialite(m.getSpecialite());
            });
        }

        return builder.build();
    }
}
