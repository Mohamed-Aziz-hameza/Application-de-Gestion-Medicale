package com.example.federebackend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OtpValidationRequest {
    private String email;
    private String codeOtp;
}
