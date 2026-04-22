package com.example.federebackend.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisponibiliteDTO {

    private Long id;
    private Long medecinId;
    private String medecinNom;
    private String medecinPrenom;
    private String medecinSpecialite;
    private LocalDate dateDisponibilite;
    private LocalTime heureDebut;
    private LocalTime heureFin;
    private String statut;
}
