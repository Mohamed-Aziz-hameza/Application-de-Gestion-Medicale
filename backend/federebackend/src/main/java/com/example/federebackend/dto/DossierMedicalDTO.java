package com.example.federebackend.dto;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DossierMedicalDTO {

    private String id;
    private Long patientId;
    private String patientNom;
    private String patientPrenom;
    private List<String> diagnostics;
    private List<String> prescriptions;
    private String notesMedecin;
    private List<String> antecedents;
    private List<String> analyses;
    private List<String> resultats;
    private List<String> imageUrls;
    private List<DossierMedicalImageDTO> images;
}
