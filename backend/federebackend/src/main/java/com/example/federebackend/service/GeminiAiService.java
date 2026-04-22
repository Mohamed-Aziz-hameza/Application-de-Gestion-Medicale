package com.example.federebackend.service;

import com.example.federebackend.config.GeminiProperties;
import com.example.federebackend.dto.CreateAnalyseAvecAiRequest;
import com.example.federebackend.entity.DossierMedical;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpServerErrorException;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GeminiAiService {

    private final GeminiProperties geminiProperties;
    private final ObjectMapper objectMapper;

    private static final List<String> FALLBACK_MODELS = List.of(
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash",
            "gemini-1.5-flash"
    );

    // ─── Public API ────────────────────────────────────────────────────────────

    public AiAnalyseDraft generateAnalyseDraft(
            DossierMedical dossier,
            CreateAnalyseAvecAiRequest request,
            String medecinNomComplet,
            String patientNomComplet) {

        validateConfig();
        String prompt = buildPrompt(dossier, request, medecinNomComplet, patientNomComplet);
        String rawText = callGeminiWithFallback(prompt);
        return parseDraft(rawText, request, dossier);
    }

    public String getProjectName() {
        return geminiProperties.getProjectName();
    }

    // ─── Validation ────────────────────────────────────────────────────────────

    private void validateConfig() {
        if (!geminiProperties.isEnabled()) {
            throw new RuntimeException("Gemini est desactive (app.gemini.enabled=false)");
        }
        if (!StringUtils.hasText(geminiProperties.getApiKey())
                || "CHANGE_ME_GEMINI_API_KEY".equals(geminiProperties.getApiKey())) {
            throw new RuntimeException("Cle Gemini non configuree. Configurez app.gemini.api-key");
        }
    }

    // ─── Prompt Builder ────────────────────────────────────────────────────────

    private String buildPrompt(
            DossierMedical dossier,
            CreateAnalyseAvecAiRequest request,
            String medecinNomComplet,
            String patientNomComplet) {

        String diagnostics     = toNumberedList(dossier.getDiagnostics());
        String prescriptions   = toNumberedList(dossier.getPrescriptions());
        String antecedents     = toNumberedList(dossier.getAntecedents());
        String analysesPassees = toNumberedList(dossier.getAnalyses());
        String resultatsPasses = toNumberedList(dossier.getResultats());

        String motif         = defaultIfBlank(request.getMotifClinique(),         "Motif non renseigne");
        String laboratoire   = defaultIfBlank(request.getLaboratoire(),            "Laboratoire non renseigne");
        String priorite      = defaultIfBlank(request.getPriorite(),               "NORMALE");
        String instructions  = defaultIfBlank(request.getInstructions(),           "Aucune instruction complementaire");
        String projectName   = defaultIfBlank(geminiProperties.getProjectName(),   "Projet non renseigne");
        String projectNumber = defaultIfBlank(geminiProperties.getProjectNumber(), "Non renseigne");
        String apiKeyName    = defaultIfBlank(geminiProperties.getApiKeyName(),    "Non renseigne");

        return "Contexte projet: " + projectName + " (numero: " + projectNumber + ")\n"
                + "Reference cle API: " + apiKeyName + "\n"
                + "Tu es un assistant clinique avance. Produis un brouillon d'analyse complet, detaille et exploitable par un medecin.\n"
                + "Ne fais pas de resume court: redige une interpretation et une conclusion longues, cliniquement argumentees, en francais medical clair.\n"
                + "Contraintes obligatoires:\n"
                + "1) Reponds STRICTEMENT en JSON valide, sans markdown, sans texte hors JSON.\n"
                + "2) Si des resultats anterieurs existent, ne retourne jamais 'Non applicable' dans resultatValeur.\n"
                + "3) intervalleReference peut etre long et detaille (normes, contexte clinique, facteurs influents).\n"
                + "4) interpretation doit etre detaillee, orientee clinique, et relier les valeurs au dossier du patient.\n"
                + "5) conclusion doit etre detaillee: synthese diagnostique, conduite a tenir, points de surveillance, et recommandations de suivi.\n"
                + "Schema JSON attendu:\n"
                + "{\n"
                + "  \"typeAnalyse\": \"string\",\n"
                + "  \"priorite\": \"NORMALE|URGENTE|A_SURVEILLER\",\n"
                + "  \"resultatValeur\": \"string\",\n"
                + "  \"unite\": \"string\",\n"
                + "  \"intervalleReference\": \"string\",\n"
                + "  \"interpretation\": \"string\",\n"
                + "  \"conclusion\": \"string\"\n"
                + "}\n\n"
                + "Patient: "      + patientNomComplet        + "\n"
                + "Medecin: "      + medecinNomComplet        + "\n"
                + "Type analyse: " + request.getTypeAnalyse() + "\n"
                + "Motif: "        + motif                    + "\n"
                + "Laboratoire: "  + laboratoire              + "\n"
                + "Priorite: "     + priorite                 + "\n"
                + "Instructions: " + instructions             + "\n\n"
                + "Donnees cliniques a exploiter integralement:\n"
                + "Diagnostics:\n"          + diagnostics     + "\n"
                + "Prescriptions:\n"        + prescriptions   + "\n"
                + "Antecedents:\n"          + antecedents     + "\n"
                + "Analyses anterieures:\n" + analysesPassees + "\n"
                + "Resultats anterieurs:\n" + resultatsPasses + "\n"
                + "Notes medecin:\n"        + defaultIfBlank(dossier.getNotesMedecin(), "Aucune note") + "\n";
    }

    // ─── Gemini Call with Retry + Fallback ─────────────────────────────────────

    private String callGeminiWithFallback(String prompt) {
        String endpoint = defaultIfBlank(
                geminiProperties.getEndpointBase(),
                "https://generativelanguage.googleapis.com/v1beta/models"
        );

        // ✅ Config model goes FIRST, then the rest of the fallbacks (no duplicates)
        String configModel = defaultIfBlank(geminiProperties.getModel(), "gemini-2.5-flash-lite");
        List<String> modelsToTry = new ArrayList<>();
        modelsToTry.add(configModel);
        FALLBACK_MODELS.stream()
                .filter(m -> !m.equals(configModel))
                .forEach(modelsToTry::add);

        for (String model : modelsToTry) {
            for (int attempt = 1; attempt <= 3; attempt++) {
                try {
                    System.out.printf("🔄 Essai modele %s (tentative %d/3)...%n", model, attempt);
                    return callGemini(prompt, model, endpoint);
                } catch (HttpServerErrorException e) {
                    if (e.getStatusCode().value() == 503) {
                        System.out.printf("⚠️ 503 sur %s (tentative %d/3) — attente %ds...%n", model, attempt, attempt * 5);
                        sleep(attempt * 5000L); // 5s, 10s, 15s
                    } else {
                        throw new RuntimeException("Erreur Gemini HTTP " + e.getStatusCode() + ": " + e.getMessage());
                    }
                } catch (RuntimeException e) {
                    throw e;
                } catch (Exception e) {
                    throw new RuntimeException("Erreur Gemini: " + e.getMessage(), e);
                }
            }
            System.out.printf("❌ Modele %s indisponible, passage au suivant...%n", model);
        }

        throw new RuntimeException("Tous les modeles Gemini sont indisponibles. Reessayez plus tard.");
    }

    private String callGemini(String prompt, String model, String endpoint) throws Exception {
        String apiKey = URLEncoder.encode(geminiProperties.getApiKey(), StandardCharsets.UTF_8);
        String url = endpoint + "/" + model + ":generateContent?key=" + apiKey;

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(textPart));

        Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.35);
            generationConfig.put("topP", 0.9);
            generationConfig.put("maxOutputTokens", 3072);

        Map<String, Object> body = new HashMap<>();
        body.put("contents", List.of(content));
        body.put("generationConfig", generationConfig);

        String requestBodyJson = objectMapper.writeValueAsString(body);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(httpRequest, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 503) {
            throw new HttpServerErrorException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Gemini 503: " + response.body()
            );
        }

        if (response.statusCode() != 200) {
            throw new RuntimeException("Gemini HTTP " + response.statusCode() + ": " + response.body());
        }

        JsonNode responseBody = objectMapper.readTree(response.body());
        JsonNode textNode = responseBody.at("/candidates/0/content/parts/0/text");

        if (textNode.isMissingNode() || !StringUtils.hasText(textNode.asText())) {
            throw new RuntimeException("Reponse Gemini invalide ou vide");
        }

        return textNode.asText();
    }

    // ─── Response Parsing ──────────────────────────────────────────────────────

    private AiAnalyseDraft parseDraft(String rawText, CreateAnalyseAvecAiRequest request, DossierMedical dossier) {
        String jsonPayload = extractJsonPayload(rawText);
        String dossierResultats = extractDossierResultats(dossier);

        if (StringUtils.hasText(jsonPayload)) {
            try {
                JsonNode node = objectMapper.readTree(jsonPayload);
                String resultatValeur = resolveResultatValeur(node.path("resultatValeur").asText(null), dossierResultats, null);
                return AiAnalyseDraft.builder()
                        .typeAnalyse(defaultIfBlank(node.path("typeAnalyse").asText(null),       request.getTypeAnalyse()))
                        .priorite(defaultIfBlank(node.path("priorite").asText(null),             defaultIfBlank(request.getPriorite(), "NORMALE")))
                        .resultatValeur(resultatValeur)
                        .unite(trimToNull(node.path("unite").asText(null)))
                        .intervalleReference(trimToNull(node.path("intervalleReference").asText(null)))
                        .interpretation(defaultIfBlank(node.path("interpretation").asText(null), "Interpretation generee avec IA"))
                        .conclusion(defaultIfBlank(node.path("conclusion").asText(null),         "Conclusion generee avec IA"))
                        .build();
            } catch (Exception ignored) {
                // fallback below
            }
        }

        String trimmed = StringUtils.hasText(rawText) ? rawText.trim() : "";
        String resultatValeur = resolveResultatValeur(null, dossierResultats, "Brouillon IA: " + trimmed);

        return AiAnalyseDraft.builder()
                .typeAnalyse(request.getTypeAnalyse())
                .priorite(defaultIfBlank(request.getPriorite(), "NORMALE"))
            .resultatValeur(resultatValeur)
            .interpretation(defaultIfBlank(trimmed, "Interpretation generee automatiquement"))
                .conclusion("Conclusion a valider par un medecin")
                .build();
    }

    private String extractJsonPayload(String rawText) {
        if (!StringUtils.hasText(rawText)) return null;

        String text = rawText.trim();
        if (text.startsWith("```")) {
            text = text.replace("```json", "").replace("```", "").trim();
        }

        int firstBrace = text.indexOf('{');
        int lastBrace  = text.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return text.substring(firstBrace, lastBrace + 1);
        }

        return text;
    }

    // ─── Utilities ─────────────────────────────────────────────────────────────

    private String toInlineList(List<String> values) {
        if (values == null || values.isEmpty()) return "Aucune donnee";
        return values.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .collect(Collectors.joining("; "));
    }

    private String toNumberedList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return "- Aucune donnee";
        }

        StringBuilder sb = new StringBuilder();
        int index = 1;
        for (String value : values) {
            if (!StringUtils.hasText(value)) {
                continue;
            }
            sb.append(index).append(") ").append(value.trim()).append("\n");
            index++;
        }

        if (index == 1) {
            return "- Aucune donnee";
        }

        return sb.toString().trim();
    }

    private String defaultIfBlank(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String extractDossierResultats(DossierMedical dossier) {
        if (dossier == null || dossier.getResultats() == null || dossier.getResultats().isEmpty()) {
            return null;
        }
        String joined = dossier.getResultats().stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .collect(Collectors.joining("; "));
        return StringUtils.hasText(joined) ? joined : null;
    }

    private String resolveResultatValeur(String candidate, String dossierResultats, String fallback) {
        if (StringUtils.hasText(candidate) && !isPlaceholderResult(candidate)) {
            return candidate.trim();
        }
        if (StringUtils.hasText(dossierResultats)) {
            return dossierResultats;
        }
        if (StringUtils.hasText(fallback)) {
            return fallback.trim();
        }
        return "Resultats a renseigner";
    }

    private boolean isPlaceholderResult(String value) {
        String normalized = value.trim().toLowerCase();
        return normalized.contains("non applicable")
                || normalized.equals("n/a")
                || normalized.equals("na")
                || normalized.contains("non renseigne")
                || normalized.contains("not applicable")
                || normalized.contains("brouillon ia disponible")
                || normalized.equals("aucun")
                || normalized.equals("none");
    }

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ignored) {}
    }

    // ─── DTO ───────────────────────────────────────────────────────────────────

    @Data
    @AllArgsConstructor
    public static class AiAnalyseDraft {
        private String typeAnalyse;
        private String priorite;
        private String resultatValeur;
        private String unite;
        private String intervalleReference;
        private String interpretation;
        private String conclusion;

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private String typeAnalyse, priorite, resultatValeur;
            private String unite, intervalleReference, interpretation, conclusion;

            public Builder typeAnalyse(String v)         { this.typeAnalyse = v;         return this; }
            public Builder priorite(String v)            { this.priorite = v;            return this; }
            public Builder resultatValeur(String v)      { this.resultatValeur = v;      return this; }
            public Builder unite(String v)               { this.unite = v;               return this; }
            public Builder intervalleReference(String v) { this.intervalleReference = v; return this; }
            public Builder interpretation(String v)      { this.interpretation = v;      return this; }
            public Builder conclusion(String v)          { this.conclusion = v;          return this; }

            public AiAnalyseDraft build() {
                return new AiAnalyseDraft(
                        typeAnalyse, priorite, resultatValeur,
                        unite, intervalleReference, interpretation, conclusion
                );
            }
        }
    }
}