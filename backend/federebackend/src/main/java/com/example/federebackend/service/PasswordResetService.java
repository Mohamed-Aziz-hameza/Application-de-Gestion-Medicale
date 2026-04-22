package com.example.federebackend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory password reset token management.
 * Tokens expire after 30 minutes.
 */
@Service
public class PasswordResetService {

    private static final long TOKEN_VALIDITY_MINUTES = 30;
    private final SecureRandom secureRandom = new SecureRandom();

    // token -> ResetTokenInfo
    private final Map<String, ResetTokenInfo> resetTokens = new ConcurrentHashMap<>();

    public record ResetTokenInfo(String email, Instant expiresAt) {}

    /**
     * Generate a secure random token for password reset.
     */
    public String generateResetToken(String email) {
        // Invalidate any existing tokens for this email
        resetTokens.entrySet().removeIf(entry -> entry.getValue().email().equalsIgnoreCase(email));

        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);

        Instant expiresAt = Instant.now().plusSeconds(TOKEN_VALIDITY_MINUTES * 60);
        resetTokens.put(token, new ResetTokenInfo(email, expiresAt));

        return token;
    }

    /**
     * Validate a reset token and return the associated email if valid.
     * Returns null if the token is invalid or expired.
     */
    public String validateToken(String token) {
        ResetTokenInfo info = resetTokens.get(token);
        if (info == null) {
            return null;
        }
        if (Instant.now().isAfter(info.expiresAt())) {
            resetTokens.remove(token);
            return null;
        }
        return info.email();
    }

    /**
     * Invalidate (consume) a reset token after successful password reset.
     */
    public void invalidateToken(String token) {
        resetTokens.remove(token);
    }

    /**
     * Cleanup expired tokens every 15 minutes.
     */
    @Scheduled(fixedRate = 900000)
    public void cleanupExpiredTokens() {
        Instant now = Instant.now();
        resetTokens.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expiresAt()));
    }
}
