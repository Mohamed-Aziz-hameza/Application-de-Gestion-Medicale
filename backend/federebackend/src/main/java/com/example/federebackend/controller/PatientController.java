package com.example.federebackend.controller;

import com.example.federebackend.dto.MessageResponse;
import com.example.federebackend.dto.RegisterPatientRequest;
import com.example.federebackend.dto.UtilisateurResponseDTO;
import com.example.federebackend.entity.*;
import com.example.federebackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final StatusCompteRepository statusCompteRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Get all patients (for Medecin to browse and create dossier/consultation).
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<UtilisateurResponseDTO>> getAllPatients() {
        List<UtilisateurResponseDTO> patients = patientRepository.findAll().stream()
                .map(p -> UtilisateurResponseDTO.builder()
                        .id(p.getUtilisateurId())
                        .nom(p.getUtilisateur().getNom())
                        .prenom(p.getUtilisateur().getPrenom())
                        .email(p.getUtilisateur().getEmail())
                        .typeUtilisateur(TypeUtilisateur.Patient)
                        .statusCompte(p.getUtilisateur().getStatusCompte() != null
                                ? p.getUtilisateur().getStatusCompte().getLibelle() : null)
                        .dateNaissance(p.getDateNaissance() != null ? p.getDateNaissance().toString() : null)
                        .telephone(p.getTelephone())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(patients);
    }

    /**
     * Get all medecins (for Patient to browse and request rendez-vous).
     */
    @GetMapping("/medecins")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<UtilisateurResponseDTO>> getAllMedecins() {
        List<UtilisateurResponseDTO> medecins = medecinRepository.findAll().stream()
                .map(m -> UtilisateurResponseDTO.builder()
                        .id(m.getUtilisateurId())
                        .nom(m.getUtilisateur().getNom())
                        .prenom(m.getUtilisateur().getPrenom())
                        .email(m.getUtilisateur().getEmail())
                        .typeUtilisateur(TypeUtilisateur.Medecin)
                        .statusCompte(m.getUtilisateur().getStatusCompte() != null
                                ? m.getUtilisateur().getStatusCompte().getLibelle() : null)
                        .specialite(m.getSpecialite())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(medecins);
    }

    /**
     * Medecin creates a new patient account (statusCompte = 1 active).
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    @Transactional
    public ResponseEntity<UtilisateurResponseDTO> createPatient(@RequestBody RegisterPatientRequest request) {
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est déjà utilisé");
        }

        StatusCompte statusActif = statusCompteRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Status compte introuvable"));

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNom(request.getNom());
        utilisateur.setPrenom(request.getPrenom());
        utilisateur.setEmail(request.getEmail());
        utilisateur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        utilisateur.setTypeUtilisateur(TypeUtilisateur.Patient);
        utilisateur.setStatusCompte(statusActif);
        utilisateur = utilisateurRepository.save(utilisateur);

        Patient patient = new Patient();
        patient.setUtilisateur(utilisateur);
        patient.setDateNaissance(request.getDateNaissance());
        patient.setTelephone(request.getTelephone());
        patientRepository.save(patient);

        UtilisateurResponseDTO dto = UtilisateurResponseDTO.builder()
                .id(utilisateur.getId())
                .nom(utilisateur.getNom())
                .prenom(utilisateur.getPrenom())
                .email(utilisateur.getEmail())
                .typeUtilisateur(TypeUtilisateur.Patient)
                .statusCompte(statusActif.getLibelle())
                .dateNaissance(request.getDateNaissance() != null ? request.getDateNaissance().toString() : null)
                .telephone(request.getTelephone())
                .build();

        return ResponseEntity.ok(dto);
    }

    /**
     * Medecin updates an existing patient.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    @Transactional
    public ResponseEntity<UtilisateurResponseDTO> updatePatient(@PathVariable Long id, @RequestBody RegisterPatientRequest request) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient introuvable"));

        Utilisateur utilisateur = patient.getUtilisateur();

        // Check email uniqueness if changed
        if (!utilisateur.getEmail().equals(request.getEmail()) && utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est déjà utilisé");
        }

        utilisateur.setNom(request.getNom());
        utilisateur.setPrenom(request.getPrenom());
        utilisateur.setEmail(request.getEmail());
        if (request.getMotDePasse() != null && !request.getMotDePasse().isBlank()) {
            utilisateur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        }
        utilisateurRepository.save(utilisateur);

        patient.setDateNaissance(request.getDateNaissance());
        patient.setTelephone(request.getTelephone());
        patientRepository.save(patient);

        UtilisateurResponseDTO dto = UtilisateurResponseDTO.builder()
                .id(utilisateur.getId())
                .nom(utilisateur.getNom())
                .prenom(utilisateur.getPrenom())
                .email(utilisateur.getEmail())
                .typeUtilisateur(TypeUtilisateur.Patient)
                .statusCompte(utilisateur.getStatusCompte() != null ? utilisateur.getStatusCompte().getLibelle() : null)
                .dateNaissance(patient.getDateNaissance() != null ? patient.getDateNaissance().toString() : null)
                .telephone(patient.getTelephone())
                .build();

        return ResponseEntity.ok(dto);
    }

    /**
     * Medecin deletes a patient account.
     */
    @DeleteMapping("/{id}")
        @PreAuthorize("hasAnyAuthority('ROLE_MEDECIN', 'ROLE_ADMIN')")
    @Transactional
    public ResponseEntity<MessageResponse> deletePatient(@PathVariable Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient introuvable"));

        patientRepository.delete(patient);
        utilisateurRepository.delete(patient.getUtilisateur());

        return ResponseEntity.ok(MessageResponse.builder().message("Patient supprimé avec succès").build());
    }
}
