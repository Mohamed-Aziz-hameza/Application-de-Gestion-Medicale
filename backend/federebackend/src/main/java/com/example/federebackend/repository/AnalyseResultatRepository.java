package com.example.federebackend.repository;

import com.example.federebackend.entity.AnalyseResultat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnalyseResultatRepository extends JpaRepository<AnalyseResultat, Long> {

    List<AnalyseResultat> findByPatientUtilisateurIdOrderByDateDemandeDesc(Long patientId);

    List<AnalyseResultat> findByMedecinUtilisateurIdOrderByDateDemandeDesc(Long medecinId);

    List<AnalyseResultat> findAllByOrderByDateDemandeDesc();

    Optional<AnalyseResultat> findByIdAndPatientUtilisateurId(Long analyseId, Long patientId);

    Optional<AnalyseResultat> findByIdAndMedecinUtilisateurId(Long analyseId, Long medecinId);
}
