package com.example.federebackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "rendez_vous")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RendezVous {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_rdv")
    private LocalDate dateRdv;

    @Column(name = "heure_rdv")
    private LocalTime heureRdv;

    @Column(name = "motif")
    private String motif;

    @Column(name = "statut")
    private String statut; // EN_ATTENTE, CONFIRME, ANNULE, TERMINE

    @Column(name = "disponibilite_id")
    private Long disponibiliteId;

    @Column(name = "date_modification_medecin")
    private LocalDateTime dateModificationMedecin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medecin_id")
    private Medecin medecin;
}
