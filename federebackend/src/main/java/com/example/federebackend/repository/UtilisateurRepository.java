package com.example.federebackend.repository;

import com.example.federebackend.entity.Utilisateur;
import com.example.federebackend.entity.TypeUtilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    Optional<Utilisateur> findByEmail(String email);

    Optional<Utilisateur> findByNomAndPrenomAndId(String nom, String prenom, Long id);

    boolean existsByEmail(String email);

    List<Utilisateur> findByTypeUtilisateur(TypeUtilisateur typeUtilisateur);
}
