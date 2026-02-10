package com.example.federebackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "administrateur")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Administrateur {
    
    @Id
    @Column(name = "utilisateur_id")
    private Long utilisateurId;
    
    @OneToOne
    @MapsId
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;
}
