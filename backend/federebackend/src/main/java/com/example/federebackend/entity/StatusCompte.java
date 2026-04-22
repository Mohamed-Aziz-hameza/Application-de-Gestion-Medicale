package com.example.federebackend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "statuscompte")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StatusCompte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "libelle", nullable = false, length = 50)
    private String libelle;
}
