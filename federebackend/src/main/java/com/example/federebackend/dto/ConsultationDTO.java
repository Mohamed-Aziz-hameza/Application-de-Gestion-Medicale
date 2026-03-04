package com.example.federebackend.dto;

import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationDTO {

    private Long id;
    private LocalDate date;
    private String type;
    private String notes;
    private String statut;

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
