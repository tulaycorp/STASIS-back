package com.stasis.stasis.service;

import com.stasis.stasis.dto.LoginRequest;
import com.stasis.stasis.dto.LoginResponse;
import com.stasis.stasis.model.Users;
import com.stasis.stasis.model.Student;
import com.stasis.stasis.model.Faculty;
import com.stasis.stasis.model.UserRole;
import com.stasis.stasis.repository.UserRepository;
import com.stasis.stasis.repository.StudentRepository;
import com.stasis.stasis.repository.FacultyRepository;
import org.springframework.beans.factory.annotation.Autowired;
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

            // Verify password (in production, use password encoder)
            if (!requestedPassword.equals(user.getPassword())) {
                System.out.println("Auth: Invalid password for user - " + requestedUsername);
                return LoginResponse.builder()
                    .success(false)
                    .message("Invalid credentials")
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
}
