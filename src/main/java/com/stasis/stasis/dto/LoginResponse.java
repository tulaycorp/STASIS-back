package com.stasis.stasis.dto;

import com.stasis.stasis.model.UserRole;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private boolean success;
    private String message;
    private String token;
    private Long userId;
    private String username;
    private String firstName;
    private String lastName;
    private UserRole role;
    private String status;
    // Additional fields for student-specific data
    private Long studentId;  // Only populated for student logins
    private String program;  // Student's/Faculty's program
    private Integer yearLevel;  // Student's year level
    
    // Faculty-specific fields
    private Long facultyId;  // Only populated for faculty logins
    private String position; // Faculty position
    private String email;    // Faculty email
}
