package com.example.federebackend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateRendezVousRequest {

    @NotNull(message = "L'identifiant du médecin est requis")
    private Long medecinId;

    private String dateRdv; // yyyy-MM-dd format

    private String heureRdv; // HH:mm format

    private String motif;
}
