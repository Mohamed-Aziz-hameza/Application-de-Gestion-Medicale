package com.example.federebackend.repository;

import com.example.federebackend.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {

    List<Consultation> findByPatientUtilisateurIdOrderByDateDesc(Long patientId);

    List<Consultation> findByMedecinUtilisateurIdOrderByDateDesc(Long medecinId);

    List<Consultation> findByPatientUtilisateurIdAndMedecinUtilisateurIdOrderByDateDesc(Long patientId, Long medecinId);

    List<Consultation> findByPatientUtilisateurIdAndTypeContainingIgnoreCaseOrderByDateDesc(Long patientId, String type);

    boolean existsByPatientUtilisateurIdAndMedecinUtilisateurIdAndDate(Long patientId, Long medecinId, LocalDate date);
}
