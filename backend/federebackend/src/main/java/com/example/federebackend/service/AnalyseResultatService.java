package com.example.federebackend.service;

import com.example.federebackend.dto.*;
import com.example.federebackend.entity.*;
import com.example.federebackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyseResultatService {

    private static final int TYPE_ANALYSE_MAX_LEN = 150;
    private static final int LABORATOIRE_MAX_LEN = 150;
    private static final int PRIORITE_MAX_LEN = 30;
    private static final int UNITE_MAX_LEN = 50;

    private final AnalyseResultatRepository analyseResultatRepository;
    private final AnalyseTimelineEventRepository analyseTimelineEventRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final RendezVousRepository rendezVousRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final NotificationService notificationService;
    private final GeminiAiService geminiAiService;

    @Transactional
    public AnalyseResultatDTO createAnalyse(Long medecinId, CreateAnalyseResultatRequest request) {
        Medecin medecin = medecinRepository.findById(medecinId)
                .orElseThrow(() -> new RuntimeException("Medecin introuvable"));

        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient introuvable"));

        RendezVous rendezVous = null;
        if (request.getRendezVousId() != null) {
            rendezVous = rendezVousRepository.findById(request.getRendezVousId())
                    .orElseThrow(() -> new RuntimeException("Rendez-vous lie introuvable"));

            if (!rendezVous.getPatient().getUtilisateurId().equals(patient.getUtilisateurId())
                    || !rendezVous.getMedecin().getUtilisateurId().equals(medecin.getUtilisateurId())) {
                throw new RuntimeException("Le rendez-vous ne correspond pas au patient ou au medecin");
            }
        }

        AnalyseResultat analyse = AnalyseResultat.builder()
            .typeAnalyse(trimToMaxLength(request.getTypeAnalyse(), TYPE_ANALYSE_MAX_LEN))
                .motifClinique(trimToNull(request.getMotifClinique()))
            .laboratoire(trimToNullMaxLength(request.getLaboratoire(), LABORATOIRE_MAX_LEN))
            .priorite(trimToMaxLength(defaultIfBlank(request.getPriorite(), "NORMALE"), PRIORITE_MAX_LEN))
                .statut("DEMANDEE")
                .progression(10)
            .createdWithAi(false)
            .approvedByDoctor(false)
                .patient(patient)
                .medecin(medecin)
                .rendezVous(rendezVous)
                .build();

        analyse = analyseResultatRepository.save(analyse);

        String motif = defaultIfBlank(analyse.getMotifClinique(), "non precise");
        appendTimeline(
                analyse,
                "DEMANDE_CREEE",
                "Analyse demandee: " + analyse.getTypeAnalyse() + " (motif: " + motif + ")",
                "ROLE_MEDECIN",
                displayName(medecin.getUtilisateur())
        );

        notificationService.createNotification(
                patient.getUtilisateurId(),
                "Nouvelle analyse medicale",
                "Une analyse '" + analyse.getTypeAnalyse() + "' a ete demandee (motif: " + motif + ").",
                "ANALYSE"
        );

        return toDTO(analyse, true);
    }

    @Transactional
    public AnalyseResultatDTO createAnalyseAvecAi(Long medecinId, CreateAnalyseAvecAiRequest request) {
    Medecin medecin = medecinRepository.findById(medecinId)
        .orElseThrow(() -> new RuntimeException("Medecin introuvable"));

    Patient patient = patientRepository.findById(request.getPatientId())
        .orElseThrow(() -> new RuntimeException("Patient introuvable"));

    RendezVous rendezVous = null;
    if (request.getRendezVousId() != null) {
        rendezVous = rendezVousRepository.findById(request.getRendezVousId())
            .orElseThrow(() -> new RuntimeException("Rendez-vous lie introuvable"));

        if (!rendezVous.getPatient().getUtilisateurId().equals(patient.getUtilisateurId())
            || !rendezVous.getMedecin().getUtilisateurId().equals(medecin.getUtilisateurId())) {
        throw new RuntimeException("Le rendez-vous ne correspond pas au patient ou au medecin");
        }
    }

    DossierMedical dossier = resolveDossierMedical(request, patient);

    GeminiAiService.AiAnalyseDraft draft = geminiAiService.generateAnalyseDraft(
        dossier,
        request,
        displayName(medecin.getUtilisateur()),
        displayName(patient.getUtilisateur())
    );

    AnalyseResultat analyse = AnalyseResultat.builder()
        .typeAnalyse(trimToMaxLength(defaultIfBlank(draft.getTypeAnalyse(), request.getTypeAnalyse().trim()), TYPE_ANALYSE_MAX_LEN))
        .motifClinique(trimToNull(request.getMotifClinique()))
        .laboratoire(trimToNullMaxLength(request.getLaboratoire(), LABORATOIRE_MAX_LEN))
        .priorite(trimToMaxLength(defaultIfBlank(draft.getPriorite(), defaultIfBlank(request.getPriorite(), "NORMALE")), PRIORITE_MAX_LEN))
        .statut("RESULTAT_DISPONIBLE")
        .progression(90)
        .resultatValeur(trimToNull(draft.getResultatValeur()))
        .unite(trimToNullMaxLength(draft.getUnite(), UNITE_MAX_LEN))
        .intervalleReference(trimToNull(draft.getIntervalleReference()))
        .interpretation(trimToNull(draft.getInterpretation()))
        .conclusion(trimToNull(draft.getConclusion()))
        .dateResultat(LocalDateTime.now())
        .createdWithAi(true)
        .approvedByDoctor(false)
        .patient(patient)
        .medecin(medecin)
        .rendezVous(rendezVous)
        .build();

    analyse = analyseResultatRepository.save(analyse);

    appendTimeline(
        analyse,
        "CREEE_AVEC_IA",
        "Analyse creee avec IA",
        "SYSTEM_IA",
        geminiAiService.getProjectName()
    );

    appendTimeline(
        analyse,
        "EN_ATTENTE_APPROBATION_MEDECIN",
        "Brouillon IA genere. Approbation medecin requise.",
        "SYSTEM_IA",
        geminiAiService.getProjectName()
    );

    String motif = defaultIfBlank(analyse.getMotifClinique(), "non precise");
    notificationService.createNotification(
        patient.getUtilisateurId(),
        "Nouvelle analyse medicale",
        "Une analyse IA '" + analyse.getTypeAnalyse() + "' a ete creee (motif: " + motif + ").",
        "ANALYSE"
    );

    return toDTO(analyse, true);
    }

    @Transactional
    public AnalyseResultatDTO approveAnalyseAi(Long analyseId, Long medecinId) {
    AnalyseResultat analyse = analyseResultatRepository.findByIdAndMedecinUtilisateurId(analyseId, medecinId)
        .orElseThrow(() -> new RuntimeException("Analyse introuvable"));

    if (!Boolean.TRUE.equals(analyse.getCreatedWithAi())) {
        throw new RuntimeException("Seules les analyses creees avec IA peuvent etre approuvees via ce flux");
    }

    if (!Boolean.TRUE.equals(analyse.getApprovedByDoctor())) {
        analyse.setApprovedByDoctor(true);
        analyse.setStatut("VALIDE");
        analyse.setProgression(100);
        if (analyse.getDateResultat() == null) {
        analyse.setDateResultat(LocalDateTime.now());
        }

        appendTimeline(
            analyse,
            "APPROBATION_MEDECIN",
            "Approuvee par un medecin",
            "ROLE_MEDECIN",
            displayName(analyse.getMedecin().getUtilisateur())
        );

        notificationService.createNotification(
            analyse.getPatient().getUtilisateurId(),
            "Analyse approuvee",
            "Votre analyse '" + analyse.getTypeAnalyse() + "' est approuvee par un medecin.",
            "ANALYSE"
        );
    }

    analyse = analyseResultatRepository.save(analyse);
    return toDTO(analyse, true);
    }

    @Transactional
    public AnalyseResultatDTO updateAnalyse(Long analyseId, Long medecinId, UpdateAnalyseResultatRequest request) {
        AnalyseResultat analyse = analyseResultatRepository.findByIdAndMedecinUtilisateurId(analyseId, medecinId)
                .orElseThrow(() -> new RuntimeException("Analyse introuvable"));

        boolean statutChanged = false;
        boolean resultUpdated = false;

        if (StringUtils.hasText(request.getStatut())) {
            String newStatut = request.getStatut().trim().toUpperCase();
            if (!newStatut.equalsIgnoreCase(analyse.getStatut())) {
                analyse.setStatut(newStatut);
                statutChanged = true;
                appendTimeline(
                        analyse,
                        "STATUT_MIS_A_JOUR",
                        "Statut mis a jour vers " + newStatut,
                        "ROLE_MEDECIN",
                        displayName(analyse.getMedecin().getUtilisateur())
                );
            }
        }

        if (request.getProgression() != null) {
            int nextProgression = Math.min(100, Math.max(0, request.getProgression()));
            if (!nextProgressionEquals(analyse.getProgression(), nextProgression)) {
                analyse.setProgression(nextProgression);
                appendTimeline(
                        analyse,
                        "PROGRESSION",
                        "Progression mise a jour a " + nextProgression + "%",
                        "ROLE_MEDECIN",
                        displayName(analyse.getMedecin().getUtilisateur())
                );
            }
        }

        if (StringUtils.hasText(request.getResultatValeur())) {
            analyse.setResultatValeur(request.getResultatValeur().trim());
            resultUpdated = true;
        }
        if (StringUtils.hasText(request.getUnite())) {
            analyse.setUnite(trimToMaxLength(request.getUnite(), UNITE_MAX_LEN));
            resultUpdated = true;
        }
        if (StringUtils.hasText(request.getIntervalleReference())) {
            analyse.setIntervalleReference(request.getIntervalleReference().trim());
            resultUpdated = true;
        }
        if (StringUtils.hasText(request.getInterpretation())) {
            analyse.setInterpretation(request.getInterpretation().trim());
            resultUpdated = true;
        }
        if (StringUtils.hasText(request.getConclusion())) {
            analyse.setConclusion(request.getConclusion().trim());
            resultUpdated = true;
        }

        if (resultUpdated) {
            analyse.setDateResultat(LocalDateTime.now());
            if (!"RESULTAT_DISPONIBLE".equalsIgnoreCase(analyse.getStatut())
                    && !"VALIDE".equalsIgnoreCase(analyse.getStatut())) {
                analyse.setStatut("RESULTAT_DISPONIBLE");
                statutChanged = true;
            }

            if (analyse.getProgression() == null || analyse.getProgression() < 90) {
                analyse.setProgression(90);
            }

            appendTimeline(
                    analyse,
                    "RESULTAT_AJOUTE",
                    "Des resultats ont ete renseignes",
                    "ROLE_MEDECIN",
                    displayName(analyse.getMedecin().getUtilisateur())
            );
        }

        if (StringUtils.hasText(request.getCommentaireTimeline())) {
            appendTimeline(
                    analyse,
                    "NOTE_MEDECIN",
                    request.getCommentaireTimeline().trim(),
                    "ROLE_MEDECIN",
                    displayName(analyse.getMedecin().getUtilisateur())
            );
        }

        if (Boolean.TRUE.equals(analyse.getCreatedWithAi())
            && "VALIDE".equalsIgnoreCase(analyse.getStatut())
            && !Boolean.TRUE.equals(analyse.getApprovedByDoctor())) {
            analyse.setApprovedByDoctor(true);
            appendTimeline(
                analyse,
                "APPROBATION_MEDECIN",
                "Approuvee par un medecin",
                "ROLE_MEDECIN",
                displayName(analyse.getMedecin().getUtilisateur())
            );
        }

        analyse = analyseResultatRepository.save(analyse);

        if (statutChanged || resultUpdated || StringUtils.hasText(request.getCommentaireTimeline())) {
            String motif = defaultIfBlank(analyse.getMotifClinique(), "non precise");
            notificationService.createNotification(
                    analyse.getPatient().getUtilisateurId(),
                    "Mise a jour de votre analyse",
                    "Analyse '" + analyse.getTypeAnalyse() + "' (motif: " + motif + ") - statut: " + analyse.getStatut(),
                    "ANALYSE"
            );
        }

        return toDTO(analyse, true);
    }

    @Transactional
    public AnalyseTimelineEventDTO addTimelineEvent(Long analyseId, Long medecinId, AddAnalyseTimelineEventRequest request) {
        AnalyseResultat analyse = analyseResultatRepository.findByIdAndMedecinUtilisateurId(analyseId, medecinId)
                .orElseThrow(() -> new RuntimeException("Analyse introuvable"));

        AnalyseTimelineEvent event = appendTimeline(
                analyse,
                defaultIfBlank(request.getEventType(), "NOTE_MEDECIN"),
                request.getDescription().trim(),
                "ROLE_MEDECIN",
                displayName(analyse.getMedecin().getUtilisateur())
        );

        return toTimelineDTO(event);
    }

    @Transactional(readOnly = true)
    public List<AnalyseResultatDTO> getMedecinAnalyses(Long medecinId) {
        return analyseResultatRepository.findByMedecinUtilisateurIdOrderByDateDemandeDesc(medecinId)
                .stream()
                .map(analyse -> toDTO(analyse, true))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AnalyseResultatDTO> getPatientAnalyses(Long patientId) {
        return analyseResultatRepository.findByPatientUtilisateurIdOrderByDateDemandeDesc(patientId)
                .stream()
                .map(analyse -> toDTO(analyse, true))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AnalyseResultatDTO> getAllAnalysesForAdmin() {
        return analyseResultatRepository.findAllByOrderByDateDemandeDesc()
                .stream()
                .map(analyse -> toDTO(analyse, true))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AnalyseResultatDTO getAnalyseForPatient(Long analyseId, Long patientId) {
        AnalyseResultat analyse = analyseResultatRepository.findByIdAndPatientUtilisateurId(analyseId, patientId)
                .orElseThrow(() -> new RuntimeException("Analyse introuvable"));
        return toDTO(analyse, true);
    }

    @Transactional(readOnly = true)
    public AnalyseResultatDTO getAnalyseForMedecin(Long analyseId, Long medecinId) {
        AnalyseResultat analyse = analyseResultatRepository.findByIdAndMedecinUtilisateurId(analyseId, medecinId)
                .orElseThrow(() -> new RuntimeException("Analyse introuvable"));
        return toDTO(analyse, true);
    }

    @Transactional(readOnly = true)
    public AnalyseResultatDTO getAnalyseForAdmin(Long analyseId) {
        AnalyseResultat analyse = analyseResultatRepository.findById(analyseId)
                .orElseThrow(() -> new RuntimeException("Analyse introuvable"));
        return toDTO(analyse, true);
    }

    private AnalyseTimelineEvent appendTimeline(
            AnalyseResultat analyse,
            String eventType,
            String description,
            String actorRole,
            String createdBy) {

        AnalyseTimelineEvent event = AnalyseTimelineEvent.builder()
                .analyse(analyse)
                .eventType(defaultIfBlank(eventType, "NOTE"))
                .description(description)
                .actorRole(defaultIfBlank(actorRole, "SYSTEM"))
                .createdBy(trimToNull(createdBy))
                .build();

        return analyseTimelineEventRepository.save(event);
    }

    private AnalyseResultatDTO toDTO(AnalyseResultat analyse, boolean includeTimeline) {
        List<AnalyseTimelineEventDTO> timeline = includeTimeline
                ? analyseTimelineEventRepository.findByAnalyseIdOrderByCreatedAtDesc(analyse.getId())
                .stream()
                .map(this::toTimelineDTO)
                .collect(Collectors.toList())
                : List.of();

        String creationType = resolveCreationType(analyse);

        AnalyseResultatDTO.AnalyseResultatDTOBuilder builder = AnalyseResultatDTO.builder()
                .id(analyse.getId())
                .typeAnalyse(analyse.getTypeAnalyse())
                .motifClinique(analyse.getMotifClinique())
                .laboratoire(analyse.getLaboratoire())
                .priorite(analyse.getPriorite())
                .statut(analyse.getStatut())
                .progression(analyse.getProgression())
                .resultatValeur(analyse.getResultatValeur())
                .unite(analyse.getUnite())
                .intervalleReference(analyse.getIntervalleReference())
                .interpretation(analyse.getInterpretation())
                .conclusion(analyse.getConclusion())
                .dateDemande(analyse.getDateDemande())
                .dateResultat(analyse.getDateResultat())
                .dateMiseAJour(analyse.getDateMiseAJour())
                .createdWithAi(Boolean.TRUE.equals(analyse.getCreatedWithAi()))
                .approvedByDoctor(Boolean.TRUE.equals(analyse.getApprovedByDoctor()))
                .creationType(creationType)
                .creationTypeLabel(resolveCreationTypeLabel(creationType))
                .timeline(timeline);

        if (analyse.getPatient() != null && analyse.getPatient().getUtilisateur() != null) {
            builder.patientId(analyse.getPatient().getUtilisateurId())
                    .patientNom(analyse.getPatient().getUtilisateur().getNom())
                    .patientPrenom(analyse.getPatient().getUtilisateur().getPrenom());
        }

        if (analyse.getMedecin() != null && analyse.getMedecin().getUtilisateur() != null) {
            builder.medecinId(analyse.getMedecin().getUtilisateurId())
                    .medecinNom(analyse.getMedecin().getUtilisateur().getNom())
                    .medecinPrenom(analyse.getMedecin().getUtilisateur().getPrenom());
        }

        if (analyse.getRendezVous() != null) {
            builder.rendezVousId(analyse.getRendezVous().getId());
        }

        return builder.build();
    }

    private AnalyseTimelineEventDTO toTimelineDTO(AnalyseTimelineEvent event) {
        return AnalyseTimelineEventDTO.builder()
                .id(event.getId())
                .eventType(event.getEventType())
                .description(event.getDescription())
                .actorRole(event.getActorRole())
                .createdBy(event.getCreatedBy())
                .createdAt(event.getCreatedAt())
                .build();
    }

    private DossierMedical resolveDossierMedical(CreateAnalyseAvecAiRequest request, Patient patient) {
        if (StringUtils.hasText(request.getDossierMedicalId())) {
            DossierMedical dossier = dossierMedicalRepository.findById(request.getDossierMedicalId().trim())
                    .orElseThrow(() -> new RuntimeException("Dossier medical introuvable"));

            if (!patient.getUtilisateurId().equals(dossier.getPatientId())) {
                throw new RuntimeException("Le dossier medical ne correspond pas au patient");
            }

            return dossier;
        }

        return dossierMedicalRepository.findByPatientId(patient.getUtilisateurId())
                .orElseThrow(() -> new RuntimeException("Dossier medical introuvable pour ce patient"));
    }

    private String resolveCreationType(AnalyseResultat analyse) {
        boolean createdWithAi = Boolean.TRUE.equals(analyse.getCreatedWithAi());
        boolean approvedByDoctor = Boolean.TRUE.equals(analyse.getApprovedByDoctor());

        if (!createdWithAi) {
            return "HUMAN_MADE";
        }
        if (approvedByDoctor) {
            return "AI_MADE_APPROVED_BY_DOCTOR";
        }
        return "AI_MADE";
    }

    private String resolveCreationTypeLabel(String creationType) {
        return switch (creationType) {
            case "AI_MADE" -> "Creee avec IA";
            case "AI_MADE_APPROVED_BY_DOCTOR" -> "Creee avec IA - approuvee par un medecin";
            default -> "Creee par un medecin";
        };
    }

    private String defaultIfBlank(String value, String defaultValue) {
        return StringUtils.hasText(value) ? value.trim() : defaultValue;
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String trimToNullMaxLength(String value, int maxLength) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return trimToMaxLength(value, maxLength);
    }

    private String trimToMaxLength(String value, int maxLength) {
        String trimmed = value.trim();
        if (trimmed.length() <= maxLength) {
            return trimmed;
        }
        return trimmed.substring(0, maxLength);
    }

    private String displayName(Utilisateur utilisateur) {
        if (utilisateur == null) {
            return null;
        }
        return utilisateur.getPrenom() + " " + utilisateur.getNom();
    }

    private boolean nextProgressionEquals(Integer current, int next) {
        return current != null && current == next;
    }
}
