package com.example.federebackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAnalyseAvecAiRequest {

    @NotNull(message = "L'identifiant du patient est requis")
    private Long patientId;

    private String dossierMedicalId;

    private Long rendezVousId;

    @NotBlank(message = "Le type d'analyse est requis")
    private String typeAnalyse;

    private String motifClinique;
    private String laboratoire;
    private String priorite;
    private String instructions;
}
