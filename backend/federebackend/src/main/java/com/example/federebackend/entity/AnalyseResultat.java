package com.example.federebackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "analyse_resultat")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyseResultat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "type_analyse", nullable = false, length = 150)
    private String typeAnalyse;

    @Column(name = "motif_clinique", columnDefinition = "TEXT")
    private String motifClinique;

    @Column(name = "laboratoire", length = 150)
    private String laboratoire;

    @Column(name = "priorite", nullable = false, length = 30)
    private String priorite;

    @Column(name = "statut", nullable = false, length = 40)
    private String statut;

    @Column(name = "progression", nullable = false)
    private Integer progression;

    @Column(name = "resultat_valeur", columnDefinition = "TEXT")
    private String resultatValeur;

    @Column(name = "unite", length = 50)
    private String unite;

    @Column(name = "intervalle_reference", columnDefinition = "TEXT")
    private String intervalleReference;

    @Column(name = "interpretation", columnDefinition = "TEXT")
    private String interpretation;

    @Column(name = "conclusion", columnDefinition = "TEXT")
    private String conclusion;

    @Column(name = "date_demande", nullable = false)
    private LocalDateTime dateDemande;

    @Column(name = "date_resultat")
    private LocalDateTime dateResultat;

    @Column(name = "date_mise_a_jour", nullable = false)
    private LocalDateTime dateMiseAJour;

    @Column(name = "created_with_ai", nullable = false)
    private Boolean createdWithAi;

    @Column(name = "approved_by_doctor", nullable = false)
    private Boolean approvedByDoctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medecin_id", nullable = false)
    private Medecin medecin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rendez_vous_id")
    private RendezVous rendezVous;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (dateDemande == null) {
            dateDemande = now;
        }
        if (dateMiseAJour == null) {
            dateMiseAJour = now;
        }
        if (statut == null || statut.isBlank()) {
            statut = "DEMANDEE";
        }
        if (priorite == null || priorite.isBlank()) {
            priorite = "NORMALE";
        }
        if (progression == null) {
            progression = 10;
        }
        if (createdWithAi == null) {
            createdWithAi = false;
        }
        if (approvedByDoctor == null) {
            approvedByDoctor = false;
        }
    }

    @PreUpdate
    public void onUpdate() {
        dateMiseAJour = LocalDateTime.now();
    }
}
