package com.example.federebackend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateDossierMedicalRequest {

    @NotNull(message = "L'identifiant du patient est requis")
    private Long patientId;

    private List<String> diagnostics;
    private List<String> prescriptions;
    private String notesMedecin;
    private List<String> antecedents;
    private List<String> analyses;
    private List<String> resultats;
    private List<String> imageUrls;
}
