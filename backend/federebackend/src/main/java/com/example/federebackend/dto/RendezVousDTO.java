package com.example.federebackend.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RendezVousDTO {

    private Long id;
    private LocalDate dateRdv;
    private LocalTime heureRdv;
    private String motif;
    private String statut;
    private Long disponibiliteId;
    private LocalDateTime dateModificationMedecin;

    // Patient info
    private Long patientId;
    private String patientNom;
    private String patientPrenom;

    // Medecin info
    private Long medecinId;
    private String medecinNom;
    private String medecinPrenom;
    private String medecinSpecialite;
}
