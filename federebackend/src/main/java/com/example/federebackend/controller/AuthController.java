package com.example.federebackend.controller;

import com.example.federebackend.dto.*;
import com.example.federebackend.service.AuthService;
import com.example.federebackend.service.TokenBlacklistService;
import com.example.federebackend.security.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final TokenBlacklistService tokenBlacklistService;
    private final JwtUtils jwtUtils;

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

    /**
     * Logout: blacklist the current JWT token.
     */
    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            String token = headerAuth.substring(7);
            if (jwtUtils.validateToken(token)) {
                long expiration = jwtUtils.getExpirationFromToken(token);
                tokenBlacklistService.blacklistToken(token, expiration);
            }
        }
        return ResponseEntity.ok(MessageResponse.builder().message("Déconnexion réussie").build());
    }

    /**
     * Forgot password: send a reset link to the user's email.
     * Works for both Patient and Medecin.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        MessageResponse response = authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(response);
    }

    /**
     * Reset password: validate token and set new password.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        MessageResponse response = authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(response);
    }

    /**
     * Validate a reset token (used by frontend to check if link is still valid).
     */
    @GetMapping("/validate-reset-token")
    public ResponseEntity<MessageResponse> validateResetToken(@RequestParam String token) {
        MessageResponse response = authService.validateResetToken(token);
        return ResponseEntity.ok(response);
    }
}
