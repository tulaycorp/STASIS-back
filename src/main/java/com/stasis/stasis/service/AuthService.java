package com.stasis.stasis.service;

import com.stasis.stasis.dto.LoginRequest;
import com.stasis.stasis.dto.LoginResponse;
import com.stasis.stasis.model.Users;
import com.stasis.stasis.model.Student;
import com.stasis.stasis.model.Faculty;
import com.stasis.stasis.repository.UserRepository;
import com.stasis.stasis.repository.StudentRepository;
import com.stasis.stasis.repository.FacultyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private FacultyRepository facultyRepository;
    
    @Autowired
    private AuthenticationManager authenticationManager;

    public LoginResponse loginUser(LoginRequest loginRequest) {
        try {
            String requestedUsername = loginRequest.getUsername();
            String requestedPassword = loginRequest.getPassword();
            String requestedRole = loginRequest.getRole();

            // Find user by username
            Users user = userRepository.findByUsername(requestedUsername);
            
            if (user == null) {
                System.out.println("Auth: User not found - " + requestedUsername);
                return LoginResponse.builder()
                    .success(false)
                    .message("Invalid credentials")
                    .build();
            }

            // Check if user is active
            if (!"active".equals(user.getStatus())) {
                System.out.println("Auth: Inactive user attempted login - " + requestedUsername);
                return LoginResponse.builder()
                    .success(false)
                    .message("Account is inactive")
                    .build();
            }

            // Verify role matches
            if (!requestedRole.equalsIgnoreCase(user.getRole().name())) {
                System.out.println("Auth: Role mismatch for user - " + requestedUsername + 
                    " (requested: " + requestedRole + ", actual: " + user.getRole() + ")");
                return LoginResponse.builder()
                    .success(false)
                    .message("Invalid role for this account")
                    .build();
            }

            // Authenticate with Spring Security
            try {
                Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(requestedUsername, requestedPassword)
                );
                
                // IMPORTANT: Set the security context BEFORE any other operations
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                // Debug: Check if authentication was properly set
                Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
                System.out.println("Auth: Authentication set successfully");
                System.out.println("Auth: Principal: " + currentAuth.getPrincipal());
                System.out.println("Auth: Authorities: " + currentAuth.getAuthorities());
                System.out.println("Auth: Is authenticated: " + currentAuth.isAuthenticated());
                System.out.println("Auth: Authentication name: " + currentAuth.getName());
                
            } catch (AuthenticationException e) {
                System.out.println("Auth: Authentication failed for user - " + requestedUsername);
                return LoginResponse.builder()
                    .success(false)
                    .message("Invalid credentials")
                    .build();
            }

            // Update last login timestamp
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            // Build successful response
            LoginResponse.LoginResponseBuilder responseBuilder = LoginResponse.builder()
                .success(true)
                .message("Login successful")
                .userId(user.getUserID())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .status(user.getStatus());

            // Add role-specific data
            switch (user.getRole()) {
                case STUDENT:
                    Optional<Student> studentOpt = studentRepository.findByFirstNameAndLastName(
                        user.getFirstName(), user.getLastName());
                    
                    if (studentOpt.isPresent()) {
                        Student student = studentOpt.get();
                        responseBuilder
                            .studentId(student.getId())
                            .yearLevel(student.getYear_level());
                        
                        if (student.getProgram() != null) {
                            responseBuilder.program(student.getProgram().getProgramName());
                        }
                    }
                    break;

                case FACULTY:
                    List<Faculty> facultyList = facultyRepository.findByFirstNameAndLastName(
                        user.getFirstName(), user.getLastName());
                    
                    if (!facultyList.isEmpty()) {
                        Faculty faculty = facultyList.get(0); // Get the first match
                        responseBuilder
                            .facultyId(faculty.getFacultyID())
                            .position(faculty.getPosition())
                            .email(faculty.getEmail());
                        
                        if (faculty.getProgram() != null) {
                            responseBuilder.program(faculty.getProgram().getProgramName());
                        }
                    }
                    break;

                case ADMIN:
                    // Admin users don't need additional data from other tables
                    // All necessary information is already in the Users table
                    break;
            }

            System.out.println("Auth: Successful login for " + requestedUsername + " (" + user.getRole() + ")");
            return responseBuilder.build();

        } catch (Exception e) {
            System.err.println("Auth: Unexpected error during login - " + e.getMessage());
            e.printStackTrace();
            return LoginResponse.builder()
                .success(false)
                .message("An error occurred during authentication")
                .build();
        }
    }
    
    public LoginResponse logoutUser() {
        try {
            SecurityContextHolder.clearContext();
            return LoginResponse.builder()
                .success(true)
                .message("Logout successful")
                .build();
        } catch (Exception e) {
            return LoginResponse.builder()
                .success(false)
                .message("Logout failed")
                .build();
        }
    }

    public Users getCurrentUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    // Debug method to check current authentication status
    public void debugCurrentAuthentication() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            System.out.println("DEBUG: No authentication in SecurityContext");
        } else {
            System.out.println("DEBUG: Authentication found - Name: " + auth.getName() + 
                             ", Authenticated: " + auth.isAuthenticated() + 
                             ", Authorities: " + auth.getAuthorities());
        }
    }
}
