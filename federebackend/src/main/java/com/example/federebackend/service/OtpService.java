package com.example.federebackend.service;

import com.example.federebackend.entity.Otp;
import com.example.federebackend.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.otp.expiration-minutes}")
    private int otpExpirationMinutes;

    /**
     * Generate a 6-digit OTP, hash it, store in DB, and return the plain OTP.
     */
    public String generateAndSaveOtp(String email) {
        String plainOtp = generateOtpCode();

        Otp otp = new Otp();
        otp.setEmail(email);
        otp.setCodeOtp(passwordEncoder.encode(plainOtp));
        otp.setDateExpiration(LocalDateTime.now().plusMinutes(otpExpirationMinutes));
        otp.setUtilise(false);
        otp.setDateCreation(LocalDateTime.now());

        otpRepository.save(otp);
        return plainOtp;
    }

    /**
     * Validate OTP: check latest unused OTP for the email,
     * verify it's not expired, not used, and matches.
     */
    public boolean validateOtp(String email, String plainOtp) {
        Optional<Otp> optOtp = otpRepository.findTopByEmailAndUtiliseFalseOrderByDateCreationDesc(email);

        if (optOtp.isEmpty()) {
            return false;
        }

        Otp otp = optOtp.get();

        // Check expiration
        if (otp.getDateExpiration().isBefore(LocalDateTime.now())) {
            return false;
        }

        // Check if already used
        if (Boolean.TRUE.equals(otp.getUtilise())) {
            return false;
        }

        // Verify OTP
        if (!passwordEncoder.matches(plainOtp, otp.getCodeOtp())) {
            return false;
        }

        // Mark as used
        otp.setUtilise(true);
        otpRepository.save(otp);
        return true;
    }

    private String generateOtpCode() {
        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000); // 6 digits
        return String.valueOf(code);
    }
}
