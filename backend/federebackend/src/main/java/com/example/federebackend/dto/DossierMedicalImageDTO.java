package com.example.federebackend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DossierMedicalImageDTO {

    private String id;
    private String fileName;
    private String contentType;
    private String dataUrl;
    private LocalDateTime uploadedAt;
}
