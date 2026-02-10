package com.example.federebackend.controller;

import com.example.federebackend.dto.*;
import com.example.federebackend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Login for Administrateur & Medecin (nom + prenom + id + motDePasse).
     * Returns JWT directly.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginMedecinAdmin(@RequestBody LoginMedecinAdminRequest request) {
        AuthResponse response = authService.loginMedecinAdmin(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Login step 1 for Patient (email + motDePasse).
     * Sends OTP to email.
     */
    @PostMapping("/login/patient")
    public ResponseEntity<MessageResponse> loginPatient(@RequestBody LoginPatientRequest request) {
        MessageResponse response = authService.loginPatientStep1(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Login step 2 for Patient: OTP validation.
     * Returns JWT on valid OTP.
     */
    @PostMapping("/login/patient/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody OtpValidationRequest request) {
        AuthResponse response = authService.loginPatientStep2(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Register a Medecin.
     */
    @PostMapping("/register/medecin")
    public ResponseEntity<MessageResponse> registerMedecin(@RequestBody RegisterMedecinRequest request) {
        MessageResponse response = authService.registerMedecin(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Register a Patient.
     */
    @PostMapping("/register/patient")
    public ResponseEntity<MessageResponse> registerPatient(@RequestBody RegisterPatientRequest request) {
        MessageResponse response = authService.registerPatient(request);
        return ResponseEntity.ok(response);
    }
}
