package com.example.federebackend.entity;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierMedicalImage {

    private String id;
    private String fileName;
    private String contentType;
    private String dataBase64;
    private LocalDateTime uploadedAt;
}
