package com.example.federebackend.service;

import com.example.federebackend.dto.UtilisateurRequestDTO;
import com.example.federebackend.dto.UtilisateurResponseDTO;
import com.example.federebackend.entity.*;
import com.example.federebackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UtilisateurService {
    
    private final UtilisateurRepository utilisateurRepository;
    private final StatusCompteRepository statusCompteRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final AdministrateurRepository administrateurRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Transactional
    public UtilisateurResponseDTO creerUtilisateur(UtilisateurRequestDTO request) {
        // Vérifier si l'email existe déjà
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est déjà utilisé");
        }
        
        // Récupérer ou créer le statut "Actif"
        StatusCompte statusCompte = statusCompteRepository.findByLibelle("Actif")
            .orElseGet(() -> {
                StatusCompte newStatus = new StatusCompte();
                newStatus.setLibelle("Actif");
                return statusCompteRepository.save(newStatus);
            });
        
        // Créer l'utilisateur
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNom(request.getNom());
        utilisateur.setPrenom(request.getPrenom());
        utilisateur.setEmail(request.getEmail());
        utilisateur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        utilisateur.setStatusCompte(statusCompte);
        utilisateur.setTypeUtilisateur(request.getTypeUtilisateur());
        
        utilisateur = utilisateurRepository.save(utilisateur);
        
        // Créer l'entité spécifique selon le type
        switch (request.getTypeUtilisateur()) {
            case Patient -> {
                Patient patient = new Patient();
                patient.setUtilisateur(utilisateur);
                if (request.getDateNaissance() != null && !request.getDateNaissance().isEmpty()) {
                    patient.setDateNaissance(LocalDate.parse(request.getDateNaissance()));
                }
                patient.setTelephone(request.getTelephone());
                patientRepository.save(patient);
                utilisateur.setPatient(patient);
            }
            case Medecin -> {
                Medecin medecin = new Medecin();
                medecin.setUtilisateur(utilisateur);
                medecin.setSpecialite(request.getSpecialite());
                medecinRepository.save(medecin);
                utilisateur.setMedecin(medecin);
            }
            case Administrateur -> {
                Administrateur admin = new Administrateur();
                admin.setUtilisateur(utilisateur);
                administrateurRepository.save(admin);
                utilisateur.setAdministrateur(admin);
            }
        }
        
        return mapToResponse(utilisateur);
    }
    
    public UtilisateurResponseDTO getUtilisateurById(Long id) {
        Utilisateur utilisateur = utilisateurRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return mapToResponse(utilisateur);
    }
    
    public UtilisateurResponseDTO getUtilisateurByEmail(String email) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return mapToResponse(utilisateur);
    }
    
    public List<UtilisateurResponseDTO> getAllUtilisateurs() {
        return utilisateurRepository.findAll().stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public UtilisateurResponseDTO updateUtilisateur(Long id, UtilisateurRequestDTO request) {
        Utilisateur utilisateur = utilisateurRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        // Vérifier si l'email est pris par un autre utilisateur
        if (!utilisateur.getEmail().equals(request.getEmail()) 
            && utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est déjà utilisé");
        }
        
        utilisateur.setNom(request.getNom());
        utilisateur.setPrenom(request.getPrenom());
        utilisateur.setEmail(request.getEmail());
        
        // Mettre à jour le mot de passe seulement s'il est fourni
        if (request.getMotDePasse() != null && !request.getMotDePasse().isEmpty()) {
            utilisateur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        }
        
        // Mettre à jour les données spécifiques
        switch (utilisateur.getTypeUtilisateur()) {
            case Patient -> {
                Patient patient = utilisateur.getPatient();
                if (patient != null) {
                    if (request.getDateNaissance() != null && !request.getDateNaissance().isEmpty()) {
                        patient.setDateNaissance(LocalDate.parse(request.getDateNaissance()));
                    }
                    patient.setTelephone(request.getTelephone());
                    patientRepository.save(patient);
                }
            }
            case Medecin -> {
                Medecin medecin = utilisateur.getMedecin();
                if (medecin != null) {
                    medecin.setSpecialite(request.getSpecialite());
                    medecinRepository.save(medecin);
                }
            }
            case Administrateur -> {
                // Pas de champs supplémentaires pour administrateur
            }
        }
        
        utilisateur = utilisateurRepository.save(utilisateur);
        return mapToResponse(utilisateur);
    }
    
    @Transactional
    public void deleteUtilisateur(Long id) {
        Utilisateur utilisateur = utilisateurRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        utilisateurRepository.delete(utilisateur);
    }
    
    private UtilisateurResponseDTO mapToResponse(Utilisateur utilisateur) {
        UtilisateurResponseDTO.UtilisateurResponseDTOBuilder builder = UtilisateurResponseDTO.builder()
            .id(utilisateur.getId())
            .nom(utilisateur.getNom())
            .prenom(utilisateur.getPrenom())
            .email(utilisateur.getEmail())
            .typeUtilisateur(utilisateur.getTypeUtilisateur())
            .statusCompte(utilisateur.getStatusCompte().getLibelle());
        
        // Ajouter les données spécifiques
        switch (utilisateur.getTypeUtilisateur()) {
            case Patient -> {
                Patient patient = utilisateur.getPatient();
                if (patient != null) {
                    if (patient.getDateNaissance() != null) {
                        builder.dateNaissance(patient.getDateNaissance().toString());
                    }
                    builder.telephone(patient.getTelephone());
                }
            }
            case Medecin -> {
                Medecin medecin = utilisateur.getMedecin();
                if (medecin != null) {
                    builder.specialite(medecin.getSpecialite());
                }
            }
            case Administrateur -> {
                // Pas de champs supplémentaires
            }
        }
        
        return builder.build();
    }
}
