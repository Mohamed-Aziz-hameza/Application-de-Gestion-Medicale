package com.example.federebackend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyseTimelineEventDTO {

    private Long id;
    private String eventType;
    private String description;
    private String actorRole;
    private String createdBy;
    private LocalDateTime createdAt;
}
