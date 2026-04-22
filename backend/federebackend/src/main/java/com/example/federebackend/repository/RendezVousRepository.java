package com.example.federebackend.repository;

import com.example.federebackend.entity.RendezVous;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface RendezVousRepository extends JpaRepository<RendezVous, Long> {

    List<RendezVous> findByPatientUtilisateurIdOrderByDateRdvDescHeureRdvDesc(Long patientId);

    List<RendezVous> findByMedecinUtilisateurIdOrderByDateRdvDescHeureRdvDesc(Long medecinId);

    List<RendezVous> findByPatientUtilisateurIdAndStatutOrderByDateRdvAsc(Long patientId, String statut);

    List<RendezVous> findByMedecinUtilisateurIdAndStatutOrderByDateRdvAsc(Long medecinId, String statut);

    List<RendezVous> findAllByOrderByDateRdvDescHeureRdvDesc();

    boolean existsByMedecinUtilisateurIdAndDateRdvAndHeureRdvAndStatutIn(
            Long medecinId,
            LocalDate dateRdv,
            LocalTime heureRdv,
            List<String> statuts
    );
}
