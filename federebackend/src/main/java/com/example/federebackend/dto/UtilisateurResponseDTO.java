package com.example.federebackend.dto;

import com.example.federebackend.entity.TypeUtilisateur;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UtilisateurResponseDTO {

    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private TypeUtilisateur typeUtilisateur;
    private String statusCompte;

    // Champs spécifiques Patient
    private String dateNaissance;
    private String telephone;

    // Champs spécifiques Médecin
    private String specialite;
}
