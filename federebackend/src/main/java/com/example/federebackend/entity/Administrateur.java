package com.example.federebackend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "administrateur")
@Getter
@Setter
@NoArgsConstructor
public class Administrateur {

    @Id
    @Column(name = "utilisateur_id")
    private Long utilisateurId;

    @OneToOne(fetch = FetchType.EAGER)
    @MapsId
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;
}
