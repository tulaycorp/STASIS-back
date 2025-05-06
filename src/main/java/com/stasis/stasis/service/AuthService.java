package com.stasis.stasis.service;

import com.stasis.stasis.dto.LoginRequest;
import com.stasis.stasis.dto.LoginResponse;
// --- Repositories are commented out/removed for placeholder ---
// import com.stasis.stasis.repository.FacultyRepository;
// import com.stasis.stasis.repository.StudentRepository;
// import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    // --- No Repositories Injected for Placeholder ---
    // @Autowired
    // private StudentRepository studentRepository;
    // @Autowired
    // private FacultyRepository facultyRepository;

    // --- No PasswordEncoder needed for Placeholder ---
    // @Autowired
    // private PasswordEncoder passwordEncoder;


    public LoginResponse loginUser(LoginRequest loginRequest) {
        // ================================================================
        // == WARNING: PLACEHOLDER AUTHENTICATION - HIGHLY INSECURE      ==
        // == DO NOT USE IN PRODUCTION. Replace with database lookup     ==
        // == and hashed password verification (e.g., Spring Security).  ==
        // ================================================================

        // Define placeholder credentials
        final String PLACEHOLDER_STUDENT_USER = "student_user";
        final String PLACEHOLDER_STUDENT_PASS = "password123";
        final String PLACEHOLDER_FACULTY_USER = "faculty_user";
        final String PLACEHOLDER_FACULTY_PASS = "password456";

        try {
            String requestedUsername = loginRequest.getUsername();
            String requestedPassword = loginRequest.getPassword();
            String requestedRole = loginRequest.getRole();

            if ("student".equalsIgnoreCase(requestedRole)) {
                if (PLACEHOLDER_STUDENT_USER.equals(requestedUsername) &&
                    PLACEHOLDER_STUDENT_PASS.equals(requestedPassword)) {
                    // Successful student login
                    System.out.println("Placeholder Auth: Student login success for " + requestedUsername); // Log success
                    return new LoginResponse(true, "Placeholder student login successful!", null, "Placeholder Student Name");
                } else {
                    // Failed student login
                    System.out.println("Placeholder Auth: Student login failed for " + requestedUsername); // Log failure
                    return new LoginResponse(false, "Invalid student credentials (placeholder)", null, null);
                }
            } else if ("faculty".equalsIgnoreCase(requestedRole)) {
                 if (PLACEHOLDER_FACULTY_USER.equals(requestedUsername) &&
                     PLACEHOLDER_FACULTY_PASS.equals(requestedPassword)) {
                    // Successful faculty login
                    System.out.println("Placeholder Auth: Faculty login success for " + requestedUsername); // Log success
                    return new LoginResponse(true, "Placeholder faculty login successful!", null, "Placeholder Faculty Name");
                } else {
                    // Failed faculty login
                    System.out.println("Placeholder Auth: Faculty login failed for " + requestedUsername); // Log failure
                    return new LoginResponse(false, "Invalid faculty credentials (placeholder)", null, null);
                }
            } else {
                // Invalid role
                System.out.println("Placeholder Auth: Invalid role specified - " + requestedRole); // Log invalid role
                return new LoginResponse(false, "Invalid role specified (placeholder)", null, null);
            }
        } catch (Exception e) {
            // Log the exception for debugging unexpected errors
            System.err.println("Placeholder Auth: Unexpected error during login - " + e.getMessage());
            e.printStackTrace(); // Print stack trace for dev environment
            return new LoginResponse(false, "Login failed due to unexpected error (placeholder)", null, null);
        }
    }
}