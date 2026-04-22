package com.example.federebackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddAnalyseTimelineEventRequest {

    private String eventType;

    @NotBlank(message = "La description de l'evenement est requise")
    private String description;
}
