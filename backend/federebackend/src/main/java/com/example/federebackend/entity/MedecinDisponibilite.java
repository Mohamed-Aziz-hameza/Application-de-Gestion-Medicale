package com.example.federebackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "medecin_disponibilite", uniqueConstraints = {
        @UniqueConstraint(name = "uk_medecin_slot", columnNames = {"medecin_id", "date_disponibilite", "heure_debut"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MedecinDisponibilite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medecin_id", nullable = false)
    private Medecin medecin;

    @Column(name = "date_disponibilite", nullable = false)
    private LocalDate dateDisponibilite;

    @Column(name = "heure_debut", nullable = false)
    private LocalTime heureDebut;

    @Column(name = "heure_fin", nullable = false)
    private LocalTime heureFin;

    @Column(name = "statut", nullable = false, length = 20)
    private String statut; // DISPONIBLE, RESERVE, INDISPONIBLE

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (statut == null || statut.isBlank()) {
            statut = "DISPONIBLE";
        }
    }
}
