package com.example.federebackend.repository;

import com.example.federebackend.entity.MedecinDisponibilite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedecinDisponibiliteRepository extends JpaRepository<MedecinDisponibilite, Long> {

    boolean existsByMedecinUtilisateurIdAndDateDisponibiliteAndHeureDebut(Long medecinId, LocalDate dateDisponibilite, LocalTime heureDebut);

    Optional<MedecinDisponibilite> findByIdAndMedecinUtilisateurId(Long id, Long medecinId);

    List<MedecinDisponibilite> findByMedecinUtilisateurIdOrderByDateDisponibiliteAscHeureDebutAsc(Long medecinId);

    List<MedecinDisponibilite> findByMedecinUtilisateurIdAndStatutOrderByDateDisponibiliteAscHeureDebutAsc(Long medecinId, String statut);

    List<MedecinDisponibilite> findByMedecinUtilisateurIdAndDateDisponibiliteAndStatutOrderByHeureDebutAsc(Long medecinId, LocalDate dateDisponibilite, String statut);
}
