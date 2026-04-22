package com.example.federebackend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.gemini")
public class GeminiProperties {

    private String apiKey = "CHANGE_ME_GEMINI_API_KEY";
    private String apiKeyName = "CHANGE_ME_GEMINI_KEY_NAME";
    private String projectName = "projet federe isil2";
    private String projectNumber = "CHANGE_ME_GCP_PROJECT_NUMBER";
    private String model = "gemini-2.5-flash";
    private boolean enabled = true;
    private String endpointBase = "https://generativelanguage.googleapis.com/v1beta/models";
}
