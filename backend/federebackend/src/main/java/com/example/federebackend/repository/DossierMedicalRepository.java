package com.example.federebackend.repository;

import com.example.federebackend.entity.DossierMedical;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DossierMedicalRepository extends MongoRepository<DossierMedical, String> {

    Optional<DossierMedical> findByPatientId(Long patientId);

    boolean existsByPatientId(Long patientId);

    void deleteByPatientId(Long patientId);
}
