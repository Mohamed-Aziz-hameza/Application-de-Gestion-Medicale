package com.example.federebackend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "DossierMedical")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierMedical {

    @Id
    private String id;

    private Long patientId;

    @Builder.Default
    private List<String> diagnostics = new ArrayList<>();

    @Builder.Default
    private List<String> prescriptions = new ArrayList<>();

    private String notesMedecin;

    @Builder.Default
    private List<String> antecedents = new ArrayList<>();

    @Builder.Default
    private List<String> analyses = new ArrayList<>();

    @Builder.Default
    private List<String> resultats = new ArrayList<>();

    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();

    @Builder.Default
    private List<DossierMedicalImage> images = new ArrayList<>();
}
