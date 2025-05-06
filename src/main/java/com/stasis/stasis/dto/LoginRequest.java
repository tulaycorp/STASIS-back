package com.stasis.stasis.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data // Lombok: Generates getters, setters, toString, equals, hashCode
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    private String username; // Or email
    private String password;
    private String role; // "student" or "faculty"
}