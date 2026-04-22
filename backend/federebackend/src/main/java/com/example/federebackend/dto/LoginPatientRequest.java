package com.example.federebackend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginPatientRequest {
    private String email;
    private String motDePasse;
}
