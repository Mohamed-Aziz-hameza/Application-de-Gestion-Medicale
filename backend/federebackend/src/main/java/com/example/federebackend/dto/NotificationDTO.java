package com.example.federebackend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {

    private Long id;
    private String titre;
    private String message;
    private String type;
    private boolean lu;
    private LocalDateTime createdAt;
}
