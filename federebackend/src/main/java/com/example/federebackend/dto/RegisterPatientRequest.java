package com.example.federebackend.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterPatientRequest {
    private String nom;
    private String prenom;
    private String email;
    private String motDePasse;
    private LocalDate dateNaissance;
    private String telephone;
}
