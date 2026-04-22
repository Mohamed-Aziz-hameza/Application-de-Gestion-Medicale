package com.example.federebackend.controller;

import com.example.federebackend.dto.CreateDisponibiliteRequest;
import com.example.federebackend.dto.DisponibiliteDTO;
import com.example.federebackend.dto.GenerateDisponibilitesRequest;
import com.example.federebackend.dto.MessageResponse;
import com.example.federebackend.entity.Utilisateur;
import com.example.federebackend.service.MedecinDisponibiliteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disponibilites")
@RequiredArgsConstructor
public class MedecinDisponibiliteController {

    private final MedecinDisponibiliteService disponibiliteService;

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<DisponibiliteDTO> createSlot(Authentication authentication, @Valid @RequestBody CreateDisponibiliteRequest request) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(disponibiliteService.createDisponibilite(utilisateur.getId(), request));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<List<DisponibiliteDTO>> generateSlots(Authentication authentication, @Valid @RequestBody GenerateDisponibilitesRequest request) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(disponibiliteService.generateDisponibilites(utilisateur.getId(), request));
    }

    @GetMapping("/medecin")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<List<DisponibiliteDTO>> getMySlots(Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(disponibiliteService.getDisponibilitesByMedecin(utilisateur.getId()));
    }

    @GetMapping("/public/medecin/{medecinId}")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<List<DisponibiliteDTO>> getAvailableSlotsByMedecinAndDate(@PathVariable Long medecinId, @RequestParam String date) {
        return ResponseEntity.ok(disponibiliteService.getDisponibilitesDisponiblesByMedecinAndDate(medecinId, date));
    }

    @PutMapping("/{slotId}/indisponible")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<DisponibiliteDTO> markSlotIndisponible(@PathVariable Long slotId, Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        return ResponseEntity.ok(disponibiliteService.markIndisponible(slotId, utilisateur.getId()));
    }

    @DeleteMapping("/{slotId}")
    @PreAuthorize("hasAuthority('ROLE_MEDECIN')")
    public ResponseEntity<MessageResponse> deleteSlot(@PathVariable Long slotId, Authentication authentication) {
        Utilisateur utilisateur = (Utilisateur) authentication.getPrincipal();
        disponibiliteService.deleteSlot(slotId, utilisateur.getId());
        return ResponseEntity.ok(MessageResponse.builder().message("Slot supprime avec succes").build());
    }
}
