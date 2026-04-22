package com.example.federebackend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateConsultationRequest {

    @NotNull(message = "L'identifiant du patient est requis")
    private Long patientId;

    private String date; // yyyy-MM-dd format

    private String type;

    private String notes;
}
