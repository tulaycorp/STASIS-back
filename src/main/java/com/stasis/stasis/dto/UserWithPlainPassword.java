package com.stasis.stasis.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO to hold both plain text password for display and the user object with hashed password
 */
@Data
@AllArgsConstructor
public class UserWithPlainPassword {
    private final com.stasis.stasis.model.Users user;
    private final String plainTextPassword;
}
