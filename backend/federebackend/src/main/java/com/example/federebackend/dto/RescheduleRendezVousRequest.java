package com.example.federebackend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleRendezVousRequest {

    @NotNull(message = "L'identifiant du nouveau slot est requis")
    private Long disponibiliteId;
}
