package com.example.federebackend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "statuscompte")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusCompte {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "libelle", nullable = false, length = 50)
    private String libelle;
}
