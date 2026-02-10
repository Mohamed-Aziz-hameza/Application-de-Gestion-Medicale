package com.example.federebackend.service;

import com.example.federebackend.dto.*;
import com.example.federebackend.entity.*;
import com.example.federebackend.repository.*;
import com.example.federebackend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final MedecinRepository medecinRepository;
    private final PatientRepository patientRepository;
    private final StatusCompteRepository statusCompteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final OtpService otpService;
    private final EmailService emailService;

    /**
     * Login for Administrateur and Medecin: nom + prenom + id + motDePasse
     * Returns JWT on success.
     */
    public AuthResponse loginMedecinAdmin(LoginMedecinAdminRequest request) {
        Utilisateur utilisateur = utilisateurRepository
                .findByNomAndPrenomAndId(request.getNom(), request.getPrenom(), request.getId())
                .orElseThrow(() -> new RuntimeException("Identifiants invalides"));

        // Must be Medecin or Administrateur
        if (utilisateur.getTypeUtilisateur() != TypeUtilisateur.Medecin &&
                utilisateur.getTypeUtilisateur() != TypeUtilisateur.Administrateur) {
            throw new RuntimeException("Type d'utilisateur non autorisé pour cette méthode de connexion");
        }

        // Check password
        if (!passwordEncoder.matches(request.getMotDePasse(), utilisateur.getMotDePasse())) {
            throw new RuntimeException("Mot de passe incorrect");
        }

        // Check account status
        if (utilisateur.getStatusCompte() != null && utilisateur.getStatusCompte().getId() == 2) {
            throw new RuntimeException("Votre compte est désactivé. Contactez un administrateur.");
        }

        String token = jwtUtils.generateToken(utilisateur.getId(), utilisateur.getTypeUtilisateur());
        String role = mapTypeToRole(utilisateur.getTypeUtilisateur());

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(utilisateur.getId())
                .nom(utilisateur.getNom())
                .prenom(utilisateur.getPrenom())
                .email(utilisateur.getEmail())
                .role(role)
                .message("Connexion réussie")
                .build();
    }

    /**
     * Login step 1 for Patient: email + motDePasse → sends OTP.
     */
    public MessageResponse loginPatientStep1(LoginPatientRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email introuvable"));

        if (utilisateur.getTypeUtilisateur() != TypeUtilisateur.Patient) {
            throw new RuntimeException("Type d'utilisateur non autorisé pour cette méthode de connexion");
        }

        if (!passwordEncoder.matches(request.getMotDePasse(), utilisateur.getMotDePasse())) {
            throw new RuntimeException("Mot de passe incorrect");
        }

        if (utilisateur.getStatusCompte() != null && utilisateur.getStatusCompte().getId() == 2) {
            throw new RuntimeException("Votre compte est désactivé. Contactez un administrateur.");
        }

        // Generate and send OTP
        String plainOtp = otpService.generateAndSaveOtp(utilisateur.getEmail());
        emailService.sendOtpEmail(utilisateur.getEmail(), plainOtp);

        return MessageResponse.builder()
                .message("Un code OTP a été envoyé à votre adresse email")
                .build();
    }

    /**
     * Login step 2 for Patient: validate OTP → returns JWT.
     */
    public AuthResponse loginPatientStep2(OtpValidationRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email introuvable"));

        if (utilisateur.getTypeUtilisateur() != TypeUtilisateur.Patient) {
            throw new RuntimeException("Type d'utilisateur non autorisé");
        }

        boolean valid = otpService.validateOtp(request.getEmail(), request.getCodeOtp());
        if (!valid) {
            throw new RuntimeException("Code OTP invalide, expiré ou déjà utilisé");
        }

        String token = jwtUtils.generateToken(utilisateur.getId(), utilisateur.getTypeUtilisateur());
        String role = mapTypeToRole(utilisateur.getTypeUtilisateur());

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(utilisateur.getId())
                .nom(utilisateur.getNom())
                .prenom(utilisateur.getPrenom())
                .email(utilisateur.getEmail())
                .role(role)
                .message("Connexion réussie")
                .build();
    }

    /**
     * Register a Medecin account. statusCompte = 2 (désactivé).
     */
    @Transactional
    public MessageResponse registerMedecin(RegisterMedecinRequest request) {
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est déjà utilisé");
        }

        StatusCompte statusDesactive = statusCompteRepository.findById(2L)
                .orElseThrow(() -> new RuntimeException("Status compte introuvable"));

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNom(request.getNom());
        utilisateur.setPrenom(request.getPrenom());
        utilisateur.setEmail(request.getEmail());
        utilisateur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        utilisateur.setTypeUtilisateur(TypeUtilisateur.Medecin);
        utilisateur.setStatusCompte(statusDesactive);

        utilisateur = utilisateurRepository.save(utilisateur);

        Medecin medecin = new Medecin();
        medecin.setUtilisateur(utilisateur);
        medecin.setSpecialite(request.getSpecialite());
        medecinRepository.save(medecin);

        return MessageResponse.builder()
                .message("Inscription réussie. Votre compte est en attente d'activation par un administrateur.")
                .build();
    }

    /**
     * Register a Patient account. statusCompte = 2 (désactivé).
     */
    @Transactional
    public MessageResponse registerPatient(RegisterPatientRequest request) {
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est déjà utilisé");
        }

        StatusCompte statusDesactive = statusCompteRepository.findById(2L)
                .orElseThrow(() -> new RuntimeException("Status compte introuvable"));

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setNom(request.getNom());
        utilisateur.setPrenom(request.getPrenom());
        utilisateur.setEmail(request.getEmail());
        utilisateur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        utilisateur.setTypeUtilisateur(TypeUtilisateur.Patient);
        utilisateur.setStatusCompte(statusDesactive);

        utilisateur = utilisateurRepository.save(utilisateur);

        Patient patient = new Patient();
        patient.setUtilisateur(utilisateur);
        patient.setDateNaissance(request.getDateNaissance());
        patient.setTelephone(request.getTelephone());
        patientRepository.save(patient);

        return MessageResponse.builder()
                .message("Inscription réussie. Votre compte est en attente d'activation par un administrateur.")
                .build();
    }

    private String mapTypeToRole(TypeUtilisateur type) {
        return switch (type) {
            case Administrateur -> "ROLE_ADMIN";
            case Medecin -> "ROLE_MEDECIN";
            case Patient -> "ROLE_PATIENT";
        };
    }
}
