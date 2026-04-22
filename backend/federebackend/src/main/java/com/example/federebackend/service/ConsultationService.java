package com.example.federebackend.service;

import com.example.federebackend.dto.ConsultationDTO;
import com.example.federebackend.dto.CreateConsultationRequest;
import com.example.federebackend.entity.*;
import com.example.federebackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;

    /**
     * Create a new consultation (called by Medecin).
     */
    @Transactional
    public ConsultationDTO createConsultation(Long medecinId, CreateConsultationRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient introuvable"));

        Medecin medecin = medecinRepository.findById(medecinId)
                .orElseThrow(() -> new RuntimeException("Médecin introuvable"));

        Consultation consultation = new Consultation();
        consultation.setDate(request.getDate() != null ? LocalDate.parse(request.getDate()) : LocalDate.now());
        consultation.setType(request.getType() != null ? request.getType() : "Consultation générale");
        consultation.setNotes(request.getNotes());
        consultation.setPatient(patient);
        consultation.setMedecin(medecin);
        consultation.setStatut("TERMINEE");

        consultation = consultationRepository.save(consultation);
        return toDTO(consultation);
    }

    /**
     * Get all consultations for a given medecin.
     */
    @Transactional(readOnly = true)
    public List<ConsultationDTO> getConsultationsByMedecin(Long medecinId) {
        return consultationRepository.findByMedecinUtilisateurIdOrderByDateDesc(medecinId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all consultations for a given patient.
     */
    @Transactional(readOnly = true)
    public List<ConsultationDTO> getConsultationsByPatient(Long patientId) {
        return consultationRepository.findByPatientUtilisateurIdOrderByDateDesc(patientId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a single consultation by ID.
     */
    @Transactional(readOnly = true)
    public ConsultationDTO getConsultationById(Long id) {
        Consultation c = consultationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Consultation introuvable"));
        return toDTO(c);
    }

    /**
     * Update a consultation (Medecin only).
     */
    @Transactional
    public ConsultationDTO updateConsultation(Long id, Long medecinId, CreateConsultationRequest request) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Consultation introuvable"));

        if (!consultation.getMedecin().getUtilisateurId().equals(medecinId)) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier cette consultation");
        }

        if (request.getDate() != null) {
            consultation.setDate(LocalDate.parse(request.getDate()));
        }
        if (request.getType() != null) {
            consultation.setType(request.getType());
        }
        if (request.getNotes() != null) {
            consultation.setNotes(request.getNotes());
        }

        consultation = consultationRepository.save(consultation);
        return toDTO(consultation);
    }

    /**
     * Delete a consultation (Medecin only).
     */
    @Transactional
    public void deleteConsultation(Long id, Long medecinId) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Consultation introuvable"));

        if (!consultation.getMedecin().getUtilisateurId().equals(medecinId)) {
            throw new RuntimeException("Vous n'êtes pas autorisé à supprimer cette consultation");
        }

        consultationRepository.delete(consultation);
    }

    /**
     * Search consultations by type for a patient.
     */
    @Transactional(readOnly = true)
    public List<ConsultationDTO> searchConsultations(Long patientId, String type) {
        return consultationRepository
                .findByPatientUtilisateurIdAndTypeContainingIgnoreCaseOrderByDateDesc(patientId, type)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private ConsultationDTO toDTO(Consultation c) {
        ConsultationDTO.ConsultationDTOBuilder builder = ConsultationDTO.builder()
                .id(c.getId())
                .date(c.getDate())
                .type(c.getType())
                .notes(c.getNotes())
                .statut(c.getStatut());

        if (c.getPatient() != null && c.getPatient().getUtilisateur() != null) {
            builder.patientId(c.getPatient().getUtilisateurId())
                    .patientNom(c.getPatient().getUtilisateur().getNom())
                    .patientPrenom(c.getPatient().getUtilisateur().getPrenom());
        }

        if (c.getMedecin() != null && c.getMedecin().getUtilisateur() != null) {
            builder.medecinId(c.getMedecin().getUtilisateurId())
                    .medecinNom(c.getMedecin().getUtilisateur().getNom())
                    .medecinPrenom(c.getMedecin().getUtilisateur().getPrenom())
                    .medecinSpecialite(c.getMedecin().getSpecialite());
        }

        return builder.build();
    }
}
