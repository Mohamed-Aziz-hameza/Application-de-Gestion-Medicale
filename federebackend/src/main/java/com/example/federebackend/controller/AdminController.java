package com.example.federebackend.controller;

import com.example.federebackend.dto.MessageResponse;
import com.example.federebackend.dto.UtilisateurResponseDTO;
import com.example.federebackend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final AdminService adminService;

    /**
     * Activate a user account.
     */
    @PutMapping("/activate/{utilisateurId}")
    public ResponseEntity<MessageResponse> activateAccount(@PathVariable Long utilisateurId) {
        String msg = adminService.activateAccount(utilisateurId);
        return ResponseEntity.ok(MessageResponse.builder().message(msg).build());
    }

    /**
     * Deactivate a user account.
     */
    @PutMapping("/deactivate/{utilisateurId}")
    public ResponseEntity<MessageResponse> deactivateAccount(@PathVariable Long utilisateurId) {
        String msg = adminService.deactivateAccount(utilisateurId);
        return ResponseEntity.ok(MessageResponse.builder().message(msg).build());
    }

    /**
     * Get all users.
     */
    @GetMapping("/utilisateurs")
    public ResponseEntity<List<UtilisateurResponseDTO>> getAllUtilisateurs() {
        return ResponseEntity.ok(adminService.getAllUtilisateurs());
    }

    /**
     * Get a single user by ID.
     */
    @GetMapping("/utilisateurs/{id}")
    public ResponseEntity<UtilisateurResponseDTO> getUtilisateurById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUtilisateurById(id));
    }
}
