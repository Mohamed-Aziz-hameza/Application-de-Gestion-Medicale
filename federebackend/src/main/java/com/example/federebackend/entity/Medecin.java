package com.example.federebackend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "medecin")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Medecin {

    @Id
    @Column(name = "utilisateur_id")
    private Long utilisateurId;

    @OneToOne(fetch = FetchType.EAGER)
    @MapsId
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @Column(name = "specialite", length = 100)
    private String specialite;
}
