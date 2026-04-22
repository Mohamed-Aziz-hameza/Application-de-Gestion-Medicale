package com.example.federebackend.service;

import com.example.federebackend.dto.CreateDisponibiliteRequest;
import com.example.federebackend.dto.DisponibiliteDTO;
import com.example.federebackend.dto.GenerateDisponibilitesRequest;
import com.example.federebackend.entity.Medecin;
import com.example.federebackend.entity.MedecinDisponibilite;
import com.example.federebackend.repository.MedecinDisponibiliteRepository;
import com.example.federebackend.repository.MedecinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedecinDisponibiliteService {

    private final MedecinDisponibiliteRepository disponibiliteRepository;
    private final MedecinRepository medecinRepository;

    @Transactional
    public DisponibiliteDTO createDisponibilite(Long medecinId, CreateDisponibiliteRequest request) {
        Medecin medecin = medecinRepository.findById(medecinId)
                .orElseThrow(() -> new RuntimeException("Medecin introuvable"));

        LocalDate date = LocalDate.parse(request.getDateDisponibilite());
        LocalTime heureDebut = LocalTime.parse(request.getHeureDebut());
        LocalTime heureFin = LocalTime.parse(request.getHeureFin());

        validateTimeRange(heureDebut, heureFin);

        if (disponibiliteRepository.existsByMedecinUtilisateurIdAndDateDisponibiliteAndHeureDebut(medecinId, date, heureDebut)) {
            throw new RuntimeException("Ce slot existe deja pour ce medecin");
        }

        MedecinDisponibilite slot = new MedecinDisponibilite();
        slot.setMedecin(medecin);
        slot.setDateDisponibilite(date);
        slot.setHeureDebut(heureDebut);
        slot.setHeureFin(heureFin);
        slot.setStatut("DISPONIBLE");

        slot = disponibiliteRepository.save(slot);
        return toDTO(slot);
    }

    @Transactional
    public List<DisponibiliteDTO> generateDisponibilites(Long medecinId, GenerateDisponibilitesRequest request) {
        Medecin medecin = medecinRepository.findById(medecinId)
                .orElseThrow(() -> new RuntimeException("Medecin introuvable"));

        LocalDate dateDebut = LocalDate.parse(request.getDateDebut());
        LocalDate dateFin = LocalDate.parse(request.getDateFin());
        if (dateFin.isBefore(dateDebut)) {
            throw new RuntimeException("La date de fin doit etre superieure ou egale a la date de debut");
        }

        LocalTime heureDebut = LocalTime.parse(request.getHeureDebut());
        LocalTime heureFin = LocalTime.parse(request.getHeureFin());
        validateTimeRange(heureDebut, heureFin);

        int duree = request.getDureeMinutes();
        if (duree <= 0) {
            throw new RuntimeException("La duree des slots doit etre superieure a 0");
        }

        Set<Integer> joursAutorises = request.getJoursSemaine() == null || request.getJoursSemaine().isEmpty()
                ? Set.of(1, 2, 3, 4, 5)
                : Set.copyOf(request.getJoursSemaine());

        List<MedecinDisponibilite> created = new ArrayList<>();

        for (LocalDate date = dateDebut; !date.isAfter(dateFin); date = date.plusDays(1)) {
            DayOfWeek day = date.getDayOfWeek();
            int dayCode = day.getValue(); // 1..7
            if (!joursAutorises.contains(dayCode)) {
                continue;
            }

            LocalTime cursor = heureDebut;
            while (cursor.plusMinutes(duree).compareTo(heureFin) <= 0) {
                LocalTime slotEnd = cursor.plusMinutes(duree);
                boolean exists = disponibiliteRepository.existsByMedecinUtilisateurIdAndDateDisponibiliteAndHeureDebut(medecinId, date, cursor);
                if (!exists) {
                    MedecinDisponibilite slot = new MedecinDisponibilite();
                    slot.setMedecin(medecin);
                    slot.setDateDisponibilite(date);
                    slot.setHeureDebut(cursor);
                    slot.setHeureFin(slotEnd);
                    slot.setStatut("DISPONIBLE");
                    created.add(slot);
                }
                cursor = slotEnd;
            }
        }

        if (created.isEmpty()) {
            return List.of();
        }

        return disponibiliteRepository.saveAll(created).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DisponibiliteDTO> getDisponibilitesByMedecin(Long medecinId) {
        return disponibiliteRepository.findByMedecinUtilisateurIdOrderByDateDisponibiliteAscHeureDebutAsc(medecinId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DisponibiliteDTO> getDisponibilitesDisponiblesByMedecinAndDate(Long medecinId, String date) {
        LocalDate targetDate = LocalDate.parse(date);
        return disponibiliteRepository.findByMedecinUtilisateurIdAndDateDisponibiliteAndStatutOrderByHeureDebutAsc(medecinId, targetDate, "DISPONIBLE")
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public DisponibiliteDTO markIndisponible(Long slotId, Long medecinId) {
        MedecinDisponibilite slot = disponibiliteRepository.findByIdAndMedecinUtilisateurId(slotId, medecinId)
                .orElseThrow(() -> new RuntimeException("Slot introuvable"));

        if ("RESERVE".equals(slot.getStatut())) {
            throw new RuntimeException("Impossible: ce slot est deja reserve");
        }

        slot.setStatut("INDISPONIBLE");
        return toDTO(disponibiliteRepository.save(slot));
    }

    @Transactional
    public void deleteSlot(Long slotId, Long medecinId) {
        MedecinDisponibilite slot = disponibiliteRepository.findByIdAndMedecinUtilisateurId(slotId, medecinId)
                .orElseThrow(() -> new RuntimeException("Slot introuvable"));

        if ("RESERVE".equals(slot.getStatut())) {
            throw new RuntimeException("Impossible: ce slot est reserve par un patient");
        }

        disponibiliteRepository.delete(slot);
    }

    @Transactional(readOnly = true)
    public List<DisponibiliteDTO> getAllDisponibilitesForAdmin() {
        return disponibiliteRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    private void validateTimeRange(LocalTime heureDebut, LocalTime heureFin) {
        if (heureFin.compareTo(heureDebut) <= 0) {
            throw new RuntimeException("L'heure de fin doit etre superieure a l'heure de debut");
        }
    }

    private DisponibiliteDTO toDTO(MedecinDisponibilite slot) {
        DisponibiliteDTO.DisponibiliteDTOBuilder builder = DisponibiliteDTO.builder()
                .id(slot.getId())
                .dateDisponibilite(slot.getDateDisponibilite())
                .heureDebut(slot.getHeureDebut())
                .heureFin(slot.getHeureFin())
                .statut(slot.getStatut());

        if (slot.getMedecin() != null) {
            builder.medecinId(slot.getMedecin().getUtilisateurId());
            if (slot.getMedecin().getUtilisateur() != null) {
                builder.medecinNom(slot.getMedecin().getUtilisateur().getNom())
                        .medecinPrenom(slot.getMedecin().getUtilisateur().getPrenom());
            }
            builder.medecinSpecialite(slot.getMedecin().getSpecialite());
        }

        return builder.build();
    }
}
