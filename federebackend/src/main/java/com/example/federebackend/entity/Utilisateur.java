package com.example.federebackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "utilisateur")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Utilisateur {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nom", nullable = false, length = 100)
    private String nom;
    
    @Column(name = "prenom", nullable = false, length = 100)
    private String prenom;
    
    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;
    
    @Column(name = "motDePasse", nullable = false, length = 255)
    private String motDePasse;
    
    @ManyToOne
    @JoinColumn(name = "statusCompte_id", nullable = false)
    private StatusCompte statusCompte;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "typeUtilisateur", nullable = false)
    private TypeUtilisateur typeUtilisateur;
    
    @OneToOne(mappedBy = "utilisateur", cascade = CascadeType.ALL, orphanRemoval = true)
    private Patient patient;
    
    @OneToOne(mappedBy = "utilisateur", cascade = CascadeType.ALL, orphanRemoval = true)
    private Medecin medecin;
    
    @OneToOne(mappedBy = "utilisateur", cascade = CascadeType.ALL, orphanRemoval = true)
    private Administrateur administrateur;
}
