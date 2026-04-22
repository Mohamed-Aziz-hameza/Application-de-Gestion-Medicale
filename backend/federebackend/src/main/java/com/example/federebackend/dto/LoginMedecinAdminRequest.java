package com.example.federebackend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginMedecinAdminRequest {
    private String nom;
    private String prenom;
    private Long id;
    private String motDePasse;
}
