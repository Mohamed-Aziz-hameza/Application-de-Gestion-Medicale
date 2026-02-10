package com.example.federebackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "medecin")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Medecin {
    
    @Id
    @Column(name = "utilisateur_id")
    private Long utilisateurId;
    
    @OneToOne
    @MapsId
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;
    
    @Column(name = "specialite", length = 100)
    private String specialite;
}
