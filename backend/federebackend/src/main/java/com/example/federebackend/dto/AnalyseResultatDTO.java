package com.example.federebackend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyseResultatDTO {

    private Long id;
    private String typeAnalyse;
    private String motifClinique;
    private String laboratoire;
    private String priorite;
    private String statut;
    private Integer progression;
    private String resultatValeur;
    private String unite;
    private String intervalleReference;
    private String interpretation;
    private String conclusion;
    private LocalDateTime dateDemande;
    private LocalDateTime dateResultat;
    private LocalDateTime dateMiseAJour;

    private Boolean createdWithAi;
    private Boolean approvedByDoctor;
    private String creationType;
    private String creationTypeLabel;

    private Long patientId;
    private String patientNom;
    private String patientPrenom;

    private Long medecinId;
    private String medecinNom;
    private String medecinPrenom;

    private Long rendezVousId;

    @Builder.Default
    private List<AnalyseTimelineEventDTO> timeline = new ArrayList<>();
}
