package com.example.federebackend.service;

import com.example.federebackend.dto.CreateRendezVousRequest;
import com.example.federebackend.dto.RendezVousDTO;
import com.example.federebackend.entity.*;
import com.example.federebackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RendezVousService {

    private final RendezVousRepository rendezVousRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final ConsultationRepository consultationRepository;

    /**
     * Patient creates a rendez-vous request with a medecin.
     */
    @Transactional
    public RendezVousDTO createRendezVous(Long patientId, CreateRendezVousRequest request) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient introuvable"));

        Medecin medecin = medecinRepository.findById(request.getMedecinId())
                .orElseThrow(() -> new RuntimeException("Médecin introuvable"));

        RendezVous rdv = new RendezVous();
        rdv.setDateRdv(request.getDateRdv() != null ? LocalDate.parse(request.getDateRdv()) : null);
        rdv.setHeureRdv(request.getHeureRdv() != null ? LocalTime.parse(request.getHeureRdv()) : null);
        rdv.setMotif(request.getMotif());
        rdv.setStatut("EN_ATTENTE");
        rdv.setPatient(patient);
        rdv.setMedecin(medecin);

        rdv = rendezVousRepository.save(rdv);
        return toDTO(rdv);
    }

    /**
     * Get all rendez-vous for a patient.
     */
    @Transactional(readOnly = true)
    public List<RendezVousDTO> getRendezVousByPatient(Long patientId) {
        return rendezVousRepository.findByPatientUtilisateurIdOrderByDateRdvDescHeureRdvDesc(patientId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all rendez-vous for a medecin.
     */
    @Transactional(readOnly = true)
    public List<RendezVousDTO> getRendezVousByMedecin(Long medecinId) {
        return rendezVousRepository.findByMedecinUtilisateurIdOrderByDateRdvDescHeureRdvDesc(medecinId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get pending rendez-vous for a medecin (for notifications).
     */
    @Transactional(readOnly = true)
    public List<RendezVousDTO> getPendingForMedecin(Long medecinId) {
        return rendezVousRepository.findByMedecinUtilisateurIdAndStatutOrderByDateRdvAsc(medecinId, "EN_ATTENTE")
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Medecin confirms or rejects a rendez-vous.
     * When marked as TERMINE, a Consultation is auto-created.
     */
    @Transactional
    public RendezVousDTO updateStatut(Long rdvId, Long medecinId, String newStatut) {
        RendezVous rdv = rendezVousRepository.findById(rdvId)
                .orElseThrow(() -> new RuntimeException("Rendez-vous introuvable"));

        if (!rdv.getMedecin().getUtilisateurId().equals(medecinId)) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier ce rendez-vous");
        }

        if (!List.of("CONFIRME", "ANNULE", "TERMINE").contains(newStatut)) {
            throw new RuntimeException("Statut invalide: " + newStatut);
        }

        rdv.setStatut(newStatut);
        rdv = rendezVousRepository.save(rdv);

        // Auto-create a consultation when rendez-vous is marked as TERMINE
        if ("TERMINE".equals(newStatut)) {
            Consultation consultation = new Consultation();
            consultation.setDate(rdv.getDateRdv() != null ? rdv.getDateRdv() : LocalDate.now());
            consultation.setType(rdv.getMotif() != null ? rdv.getMotif() : "Consultation générale");
            consultation.setNotes("Consultation issue du rendez-vous du " + rdv.getDateRdv() + " à " + rdv.getHeureRdv());
            consultation.setPatient(rdv.getPatient());
            consultation.setMedecin(rdv.getMedecin());
            consultation.setStatut("TERMINEE");
            consultationRepository.save(consultation);
        }

        return toDTO(rdv);
    }

    /**
     * Patient cancels a rendez-vous.
     */
    @Transactional
    public RendezVousDTO cancelRendezVous(Long rdvId, Long patientId) {
        RendezVous rdv = rendezVousRepository.findById(rdvId)
                .orElseThrow(() -> new RuntimeException("Rendez-vous introuvable"));

        if (!rdv.getPatient().getUtilisateurId().equals(patientId)) {
            throw new RuntimeException("Vous n'êtes pas autorisé à annuler ce rendez-vous");
        }

        if (!"EN_ATTENTE".equals(rdv.getStatut()) && !"CONFIRME".equals(rdv.getStatut())) {
            throw new RuntimeException("Ce rendez-vous ne peut plus être annulé");
        }

        rdv.setStatut("ANNULE");
        rdv = rendezVousRepository.save(rdv);
        return toDTO(rdv);
    }

    /**
     * Delete a rendez-vous.
     */
    @Transactional
    public void deleteRendezVous(Long rdvId, Long medecinId) {
        RendezVous rdv = rendezVousRepository.findById(rdvId)
                .orElseThrow(() -> new RuntimeException("Rendez-vous introuvable"));

        if (!rdv.getMedecin().getUtilisateurId().equals(medecinId)) {
            throw new RuntimeException("Vous n'êtes pas autorisé à supprimer ce rendez-vous");
        }

        rendezVousRepository.delete(rdv);
    }

    private RendezVousDTO toDTO(RendezVous rdv) {
        RendezVousDTO.RendezVousDTOBuilder builder = RendezVousDTO.builder()
                .id(rdv.getId())
                .dateRdv(rdv.getDateRdv())
                .heureRdv(rdv.getHeureRdv())
                .motif(rdv.getMotif())
                .statut(rdv.getStatut());

        if (rdv.getPatient() != null && rdv.getPatient().getUtilisateur() != null) {
            builder.patientId(rdv.getPatient().getUtilisateurId())
                    .patientNom(rdv.getPatient().getUtilisateur().getNom())
                    .patientPrenom(rdv.getPatient().getUtilisateur().getPrenom());
        }

        if (rdv.getMedecin() != null && rdv.getMedecin().getUtilisateur() != null) {
            builder.medecinId(rdv.getMedecin().getUtilisateurId())
                    .medecinNom(rdv.getMedecin().getUtilisateur().getNom())
                    .medecinPrenom(rdv.getMedecin().getUtilisateur().getPrenom())
                    .medecinSpecialite(rdv.getMedecin().getSpecialite());
        }

        return builder.build();
    }
}
