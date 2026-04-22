package com.example.federebackend.service;

import com.example.federebackend.dto.CreateRendezVousRequest;
import com.example.federebackend.dto.RendezVousDTO;
import com.example.federebackend.entity.*;
import com.example.federebackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RendezVousService {

    private final RendezVousRepository rendezVousRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final MedecinDisponibiliteRepository disponibiliteRepository;
    private final ConsultationRepository consultationRepository;
    private final NotificationService notificationService;

    /**
     * Patient creates a rendez-vous request with a medecin.
     */
    @Transactional
    public RendezVousDTO createRendezVous(Long patientId, CreateRendezVousRequest request) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient introuvable"));

        RendezVous rdv = new RendezVous();
        rdv.setPatient(patient);

        // Automatic booking from an available slot
        if (request.getDisponibiliteId() != null) {
            MedecinDisponibilite slot = disponibiliteRepository.findById(request.getDisponibiliteId())
                .orElseThrow(() -> new RuntimeException("Slot introuvable"));

            if (!"DISPONIBLE".equals(slot.getStatut())) {
            throw new RuntimeException("Ce slot n'est plus disponible");
            }

            rdv.setDateRdv(slot.getDateDisponibilite());
            rdv.setHeureRdv(slot.getHeureDebut());
            rdv.setMotif(request.getMotif() != null ? request.getMotif() : "Consultation generale");
            rdv.setStatut("CONFIRME");
            rdv.setMedecin(slot.getMedecin());
            rdv.setDisponibiliteId(slot.getId());

            rdv = rendezVousRepository.save(rdv);

            slot.setStatut("RESERVE");
            disponibiliteRepository.save(slot);

            notificationService.createNotification(
                slot.getMedecin().getUtilisateurId(),
                "Nouveau rendez-vous reserve",
                "Un patient a reserve le slot du " + slot.getDateDisponibilite() + " a " + slot.getHeureDebut()
                        + " (motif: " + safeMotif(rdv.getMotif()) + ")",
                "RENDEZ_VOUS"
            );

            return toDTO(rdv);
        }

        // Backward-compatible manual request flow
        Medecin medecin = medecinRepository.findById(request.getMedecinId())
            .orElseThrow(() -> new RuntimeException("Medecin introuvable"));

        LocalDate date = request.getDateRdv() != null ? LocalDate.parse(request.getDateRdv()) : null;
        LocalTime heure = request.getHeureRdv() != null ? LocalTime.parse(request.getHeureRdv()) : null;
        if (date == null || heure == null) {
            throw new RuntimeException("Date et heure sont requises si aucun slot n'est selectionne");
        }

        boolean alreadyTaken = rendezVousRepository.existsByMedecinUtilisateurIdAndDateRdvAndHeureRdvAndStatutIn(
            medecin.getUtilisateurId(),
            date,
            heure,
            List.of("EN_ATTENTE", "CONFIRME")
        );
        if (alreadyTaken) {
            throw new RuntimeException("Ce creneau est deja reserve");
        }

        rdv.setDateRdv(date);
        rdv.setHeureRdv(heure);
        rdv.setMotif(request.getMotif());
        rdv.setStatut("EN_ATTENTE");
        rdv.setMedecin(medecin);

        rdv = rendezVousRepository.save(rdv);

        notificationService.createNotification(
            medecin.getUtilisateurId(),
            "Demande de rendez-vous",
            "Nouveau rendez-vous en attente le " + rdv.getDateRdv() + " a " + rdv.getHeureRdv()
                    + " (motif: " + safeMotif(rdv.getMotif()) + ")",
            "RENDEZ_VOUS"
        );

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

        if ("ANNULE".equals(newStatut)) {
            releaseSlot(rdv.getDisponibiliteId());
        }

        // Auto-create a consultation when rendez-vous is marked as TERMINE
        if ("TERMINE".equals(newStatut)) {
            LocalDate consultationDate = rdv.getDateRdv() != null ? rdv.getDateRdv() : LocalDate.now();
            boolean exists = consultationRepository.existsByPatientUtilisateurIdAndMedecinUtilisateurIdAndDate(
                    rdv.getPatient().getUtilisateurId(),
                    rdv.getMedecin().getUtilisateurId(),
                    consultationDate
            );

            if (!exists) {
                Consultation consultation = new Consultation();
                consultation.setDate(consultationDate);
                consultation.setType(rdv.getMotif() != null ? rdv.getMotif() : "Consultation generale");
                consultation.setNotes("Consultation issue du rendez-vous du " + rdv.getDateRdv() + " a " + rdv.getHeureRdv());
                consultation.setPatient(rdv.getPatient());
                consultation.setMedecin(rdv.getMedecin());
                consultation.setStatut("TERMINEE");
                consultationRepository.save(consultation);
            }
        }

        notificationService.createNotification(
                rdv.getPatient().getUtilisateurId(),
                "Mise a jour de rendez-vous",
            "Votre rendez-vous du " + rdv.getDateRdv() + " a " + rdv.getHeureRdv()
                + " (motif: " + safeMotif(rdv.getMotif()) + ") est maintenant: " + newStatut,
                "RENDEZ_VOUS"
        );

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

        releaseSlot(rdv.getDisponibiliteId());

        notificationService.createNotification(
                rdv.getMedecin().getUtilisateurId(),
                "Annulation patient",
            "Le patient a annule le rendez-vous du " + rdv.getDateRdv() + " a " + rdv.getHeureRdv()
                + " (motif: " + safeMotif(rdv.getMotif()) + ")",
                "RENDEZ_VOUS"
        );

        return toDTO(rdv);
    }

    /**
     * Medecin can reschedule a booked rendez-vous to another available slot.
     */
    @Transactional
    public RendezVousDTO rescheduleRendezVous(Long rdvId, Long medecinId, Long newSlotId) {
        RendezVous rdv = rendezVousRepository.findById(rdvId)
                .orElseThrow(() -> new RuntimeException("Rendez-vous introuvable"));

        if (!rdv.getMedecin().getUtilisateurId().equals(medecinId)) {
            throw new RuntimeException("Vous n'etes pas autorise a modifier ce rendez-vous");
        }

        if ("ANNULE".equals(rdv.getStatut()) || "TERMINE".equals(rdv.getStatut())) {
            throw new RuntimeException("Ce rendez-vous ne peut plus etre replanifie");
        }

        MedecinDisponibilite newSlot = disponibiliteRepository.findByIdAndMedecinUtilisateurId(newSlotId, medecinId)
                .orElseThrow(() -> new RuntimeException("Nouveau slot introuvable"));

        if (!"DISPONIBLE".equals(newSlot.getStatut())) {
            throw new RuntimeException("Le nouveau slot n'est pas disponible");
        }

        Long oldSlotId = rdv.getDisponibiliteId();

        rdv.setDateRdv(newSlot.getDateDisponibilite());
        rdv.setHeureRdv(newSlot.getHeureDebut());
        rdv.setDisponibiliteId(newSlot.getId());
        rdv.setStatut("CONFIRME");
        rdv.setDateModificationMedecin(LocalDateTime.now());
        rdv = rendezVousRepository.save(rdv);

        newSlot.setStatut("RESERVE");
        disponibiliteRepository.save(newSlot);

        if (oldSlotId != null && !oldSlotId.equals(newSlotId)) {
            releaseSlot(oldSlotId);
        }

        notificationService.createNotification(
                rdv.getPatient().getUtilisateurId(),
                "Rendez-vous replanifie",
            "Votre rendez-vous a ete replanifie au " + rdv.getDateRdv() + " a " + rdv.getHeureRdv()
                + " (motif: " + safeMotif(rdv.getMotif()) + ")",
                "RENDEZ_VOUS"
        );

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

        releaseSlot(rdv.getDisponibiliteId());
        rendezVousRepository.delete(rdv);
    }

    @Transactional(readOnly = true)
    public List<RendezVousDTO> getAllRendezVousForAdmin() {
        return rendezVousRepository.findAllByOrderByDateRdvDescHeureRdvDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private void releaseSlot(Long slotId) {
        if (slotId == null) {
            return;
        }

        disponibiliteRepository.findById(slotId).ifPresent(slot -> {
            if ("RESERVE".equals(slot.getStatut())) {
                slot.setStatut("DISPONIBLE");
                disponibiliteRepository.save(slot);
            }
        });
    }

    private String safeMotif(String motif) {
        return (motif == null || motif.isBlank()) ? "non precise" : motif;
    }

    private RendezVousDTO toDTO(RendezVous rdv) {
        RendezVousDTO.RendezVousDTOBuilder builder = RendezVousDTO.builder()
                .id(rdv.getId())
                .dateRdv(rdv.getDateRdv())
                .heureRdv(rdv.getHeureRdv())
                .motif(rdv.getMotif())
                .statut(rdv.getStatut())
                .disponibiliteId(rdv.getDisponibiliteId())
                .dateModificationMedecin(rdv.getDateModificationMedecin());

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
