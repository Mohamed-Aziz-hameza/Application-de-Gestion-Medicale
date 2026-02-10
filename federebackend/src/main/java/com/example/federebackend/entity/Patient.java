package com.example.federebackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "patient")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Patient {
    
    @Id
    @Column(name = "utilisateur_id")
    private Long utilisateurId;
    
    @OneToOne
    @MapsId
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;
    
    @Column(name = "dateNaissance")
    private LocalDate dateNaissance;
    
    @Column(name = "telephone", length = 20)
    private String telephone;
}
