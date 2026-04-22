package com.example.federebackend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAnalyseResultatRequest {

    private String statut;
    private Integer progression;

    private String resultatValeur;
    private String unite;
    private String intervalleReference;
    private String interpretation;
    private String conclusion;

    private String commentaireTimeline;
}
