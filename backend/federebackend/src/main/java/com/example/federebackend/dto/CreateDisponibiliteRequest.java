package com.example.federebackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateDisponibiliteRequest {

    @NotBlank(message = "La date est requise")
    private String dateDisponibilite; // yyyy-MM-dd

    @NotBlank(message = "L'heure de debut est requise")
    private String heureDebut; // HH:mm

    @NotBlank(message = "L'heure de fin est requise")
    private String heureFin; // HH:mm
}
