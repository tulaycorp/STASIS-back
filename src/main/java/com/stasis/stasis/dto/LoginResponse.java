package com.stasis.stasis.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private boolean success;
    private String message;
    private String token; // Optional: If using JWT (null in placeholder)
    private String userDisplayName; // Placeholder name
}