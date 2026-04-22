package com.example.federebackend.service;

import com.example.federebackend.dto.CreateDossierMedicalRequest;
import com.example.federebackend.dto.DossierMedicalDTO;
import com.example.federebackend.dto.DossierMedicalImageDTO;
import com.example.federebackend.entity.DossierMedical;
import com.example.federebackend.entity.DossierMedicalImage;
import com.example.federebackend.entity.Patient;
import com.example.federebackend.repository.DossierMedicalRepository;
import com.example.federebackend.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DossierMedicalService {

    private final DossierMedicalRepository dossierMedicalRepository;
    private final PatientRepository patientRepository;

    /**
     * Create a new dossier medical for a patient (Medecin only).
     */
    public DossierMedicalDTO createDossierMedical(CreateDossierMedicalRequest request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient introuvable"));

        if (dossierMedicalRepository.existsByPatientId(request.getPatientId())) {
            throw new RuntimeException("Un dossier médical existe déjà pour ce patient");
        }

        DossierMedical dossier = DossierMedical.builder()
                .patientId(request.getPatientId())
                .diagnostics(request.getDiagnostics() != null ? request.getDiagnostics() : new ArrayList<>())
                .prescriptions(request.getPrescriptions() != null ? request.getPrescriptions() : new ArrayList<>())
                .notesMedecin(request.getNotesMedecin())
            .antecedents(request.getAntecedents() != null ? request.getAntecedents() : new ArrayList<>())
            .analyses(request.getAnalyses() != null ? request.getAnalyses() : new ArrayList<>())
            .resultats(request.getResultats() != null ? request.getResultats() : new ArrayList<>())
            .imageUrls(request.getImageUrls() != null ? request.getImageUrls() : new ArrayList<>())
            .images(new ArrayList<>())
                .build();

        dossier = dossierMedicalRepository.save(dossier);
        return toDTO(dossier, patient);
    }

    /**
     * Get dossier medical by patient ID.
     */
    @Transactional(readOnly = true)
    public DossierMedicalDTO getDossierByPatientId(Long patientId) {
        DossierMedical dossier = dossierMedicalRepository.findByPatientId(patientId)
                .orElseThrow(() -> new RuntimeException("Dossier médical introuvable pour ce patient"));

        Patient patient = patientRepository.findById(patientId).orElse(null);
        return toDTO(dossier, patient);
    }

    /**
     * Update an existing dossier medical (Medecin only).
     */
    public DossierMedicalDTO updateDossierMedical(String id, CreateDossierMedicalRequest request) {
        DossierMedical dossier = dossierMedicalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dossier médical introuvable"));

        if (request.getDiagnostics() != null) {
            dossier.setDiagnostics(request.getDiagnostics());
        }
        if (request.getPrescriptions() != null) {
            dossier.setPrescriptions(request.getPrescriptions());
        }
        if (request.getNotesMedecin() != null) {
            dossier.setNotesMedecin(request.getNotesMedecin());
        }
        if (request.getAntecedents() != null) {
            dossier.setAntecedents(request.getAntecedents());
        }
        if (request.getAnalyses() != null) {
            dossier.setAnalyses(request.getAnalyses());
        }
        if (request.getResultats() != null) {
            dossier.setResultats(request.getResultats());
        }
        if (request.getImageUrls() != null) {
            dossier.setImageUrls(request.getImageUrls());
        }

        dossier = dossierMedicalRepository.save(dossier);
        Patient patient = patientRepository.findById(dossier.getPatientId()).orElse(null);
        return toDTO(dossier, patient);
    }

    /**
     * Upload one or multiple medical images from the doctor workstation into MongoDB.
     */
    public DossierMedicalDTO uploadImages(String dossierId, List<MultipartFile> files) {
        DossierMedical dossier = dossierMedicalRepository.findById(dossierId)
                .orElseThrow(() -> new RuntimeException("Dossier médical introuvable"));

        if (files == null || files.isEmpty()) {
            throw new RuntimeException("Aucun fichier image fourni");
        }

        if (dossier.getImages() == null) {
            dossier.setImages(new ArrayList<>());
        }

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
            if (!contentType.startsWith("image/")) {
                throw new RuntimeException("Seuls les fichiers image sont autorises");
            }

            try {
                byte[] bytes = file.getBytes();
                String base64 = Base64.getEncoder().encodeToString(bytes);

                DossierMedicalImage image = DossierMedicalImage.builder()
                        .id(UUID.randomUUID().toString())
                        .fileName(file.getOriginalFilename())
                        .contentType(contentType)
                        .dataBase64(base64)
                        .uploadedAt(LocalDateTime.now())
                        .build();

                dossier.getImages().add(image);
            } catch (Exception ex) {
                throw new RuntimeException("Erreur lors du chargement de l'image: " + file.getOriginalFilename());
            }
        }

        dossier = dossierMedicalRepository.save(dossier);
        Patient patient = patientRepository.findById(dossier.getPatientId()).orElse(null);
        return toDTO(dossier, patient);
    }

    /**
     * Remove a stored medical image from dossier.
     */
    public DossierMedicalDTO deleteImage(String dossierId, String imageId) {
        DossierMedical dossier = dossierMedicalRepository.findById(dossierId)
                .orElseThrow(() -> new RuntimeException("Dossier médical introuvable"));

        if (dossier.getImages() == null || dossier.getImages().isEmpty()) {
            throw new RuntimeException("Aucune image à supprimer");
        }

        boolean removed = dossier.getImages().removeIf(img -> imageId.equals(img.getId()));
        if (!removed) {
            throw new RuntimeException("Image introuvable dans ce dossier");
        }

        dossier = dossierMedicalRepository.save(dossier);
        Patient patient = patientRepository.findById(dossier.getPatientId()).orElse(null);
        return toDTO(dossier, patient);
    }

    /**
     * Delete a dossier medical by ID.
     */
    public void deleteDossierMedical(String id) {
        if (!dossierMedicalRepository.existsById(id)) {
            throw new RuntimeException("Dossier médical introuvable");
        }
        dossierMedicalRepository.deleteById(id);
    }

    /**
     * Get all dossier medical records (for admin/medecin listing).
     */
    @Transactional(readOnly = true)
    public List<DossierMedicalDTO> getAllDossiers() {
        return dossierMedicalRepository.findAll().stream()
                .map(d -> {
                    Patient patient = patientRepository.findById(d.getPatientId()).orElse(null);
                    return toDTO(d, patient);
                })
                .collect(Collectors.toList());
    }

    private DossierMedicalDTO toDTO(DossierMedical dossier, Patient patient) {
        DossierMedicalDTO.DossierMedicalDTOBuilder builder = DossierMedicalDTO.builder()
                .id(dossier.getId())
                .patientId(dossier.getPatientId())
                .diagnostics(dossier.getDiagnostics())
                .prescriptions(dossier.getPrescriptions())
            .notesMedecin(dossier.getNotesMedecin())
            .antecedents(dossier.getAntecedents())
            .analyses(dossier.getAnalyses())
            .resultats(dossier.getResultats())
            .imageUrls(dossier.getImageUrls())
            .images(mapImages(dossier.getImages()));

        if (patient != null && patient.getUtilisateur() != null) {
            builder.patientNom(patient.getUtilisateur().getNom())
                    .patientPrenom(patient.getUtilisateur().getPrenom());
        }

        return builder.build();
    }

    private List<DossierMedicalImageDTO> mapImages(List<DossierMedicalImage> images) {
        if (images == null || images.isEmpty()) {
            return new ArrayList<>();
        }

        return images.stream()
                .map(img -> DossierMedicalImageDTO.builder()
                        .id(img.getId())
                        .fileName(img.getFileName())
                        .contentType(img.getContentType())
                        .uploadedAt(img.getUploadedAt())
                        .dataUrl(toDataUrl(img.getContentType(), img.getDataBase64()))
                        .build())
                .collect(Collectors.toList());
    }

    private String toDataUrl(String contentType, String base64) {
        if (base64 == null) {
            return null;
        }
        String mime = (contentType == null || contentType.isBlank()) ? "application/octet-stream" : contentType;
        return "data:" + mime + ";base64," + base64;
    }
}
