package com.example.federebackend.service;

import com.example.federebackend.entity.StatusCompte;
import com.example.federebackend.entity.Utilisateur;
import com.example.federebackend.repository.StatusCompteRepository;
import com.example.federebackend.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UtilisateurRepository utilisateurRepository;
    private final StatusCompteRepository statusCompteRepository;

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
     * Get all utilisateurs.
     */
    public List<Utilisateur> getAllUtilisateurs() {
        return utilisateurRepository.findAll();
    }

    /**
     * Get a single utilisateur by ID.
     */
    public Utilisateur getUtilisateurById(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
    }
}
