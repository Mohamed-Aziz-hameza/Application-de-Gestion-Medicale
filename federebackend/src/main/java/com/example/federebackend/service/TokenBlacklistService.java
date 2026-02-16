package com.example.federebackend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory token blacklist for logout support.
 * Blacklisted tokens are stored with their expiration time
 * and cleaned up periodically.
 */
@Service
public class TokenBlacklistService {

    // token -> expiration timestamp in millis
    private final Map<String, Long> blacklistedTokens = new ConcurrentHashMap<>();

    /**
     * Blacklist a token so it cannot be used anymore.
     *
     * @param token             the JWT token to blacklist
     * @param expirationMillis  the token's original expiration time in epoch millis
     */
    public void blacklistToken(String token, long expirationMillis) {
        blacklistedTokens.put(token, expirationMillis);
    }

    /**
     * Check if a token has been blacklisted.
     */
    public boolean isBlacklisted(String token) {
        return blacklistedTokens.containsKey(token);
    }

    /**
     * Periodically remove expired tokens from the blacklist (every 30 minutes).
     */
    @Scheduled(fixedRate = 1800000)
    public void cleanupExpiredTokens() {
        long now = System.currentTimeMillis();
        blacklistedTokens.entrySet().removeIf(entry -> entry.getValue() < now);
    }
}
