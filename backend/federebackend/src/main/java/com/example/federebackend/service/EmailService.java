package com.example.federebackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.properties.mail.from}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public void sendOtpEmail(String toEmail, String otpCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Votre code OTP - App Médicale");
        message.setText("Bonjour,\n\nVotre code OTP est : " + otpCode +
                "\n\nCe code est valide pendant 10 minutes.\n\nCordialement,\nApp Médicale");

        mailSender.send(message);
    }

    /**
     * Send a password reset email with a link to the frontend reset page.
     */
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Réinitialisation de votre mot de passe - MediCare+");
        message.setText("Bonjour,\n\n" +
                "Vous avez demandé la réinitialisation de votre mot de passe.\n\n" +
                "Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :\n" +
                resetLink + "\n\n" +
                "Ce lien est valide pendant 30 minutes.\n\n" +
                "Si vous n'avez pas fait cette demande, ignorez cet email.\n\n" +
                "Cordialement,\nL'équipe MediCare+");

        mailSender.send(message);
    }
}
