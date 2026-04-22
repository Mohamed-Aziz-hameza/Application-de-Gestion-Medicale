package com.example.federebackend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateDisponibilitesRequest {

    @NotBlank(message = "La date de debut est requise")
    private String dateDebut; // yyyy-MM-dd

    @NotBlank(message = "La date de fin est requise")
    private String dateFin; // yyyy-MM-dd

    @NotBlank(message = "L'heure de debut est requise")
    private String heureDebut; // HH:mm

    @NotBlank(message = "L'heure de fin est requise")
    private String heureFin; // HH:mm

    @Min(value = 5, message = "La duree minimale d'un slot est 5 minutes")
    private int dureeMinutes;

    private List<Integer> joursSemaine; // 1=Lundi ... 7=Dimanche
}
