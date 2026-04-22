package com.example.federebackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAnalyseResultatRequest {

    @NotNull(message = "L'identifiant du patient est requis")
    private Long patientId;

    private Long rendezVousId;

    @NotBlank(message = "Le type d'analyse est requis")
    private String typeAnalyse;

    private String motifClinique;
    private String laboratoire;
    private String priorite;
}
