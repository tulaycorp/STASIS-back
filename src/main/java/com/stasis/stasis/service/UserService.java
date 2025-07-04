package com.stasis.stasis.service;

import com.stasis.stasis.model.Users;
import com.stasis.stasis.model.UserRole;
import com.stasis.stasis.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Users createUser(Users user) {
        // Encode password if it's not already encoded
        if (user.getPassword() != null && !user.getPassword().startsWith("$2a$")) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return userRepository.save(user);
    }

    public Users createUserWithGeneratedCredentials(String firstName, String lastName, String email, UserRole role) {
        String username = generateUsername(role);
        String password = generatePassword();
        
        Users user = Users.builder()
                .username(username)
                .password(passwordEncoder.encode(password)) // Properly encode the password
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .role(role)
                .build();
        
        return userRepository.save(user);
    }

    public com.stasis.stasis.dto.UserWithPlainPassword createUserWithGeneratedCredentialsForDisplay(String firstName, String lastName, String email, UserRole role) {
        String username = generateUsername(role);
        String plainTextPassword = generatePassword();
        
        Users user = Users.builder()
                .username(username)
                .password(passwordEncoder.encode(plainTextPassword)) // Hash the password for storage
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .role(role)
                .build();
        
        Users savedUser = userRepository.save(user);
        return new com.stasis.stasis.dto.UserWithPlainPassword(savedUser, plainTextPassword);
    }

    private String generateUsername(UserRole role) {
        int currentYear = LocalDate.now().getYear();
        String roleCode = role == UserRole.STUDENT ? "S" : "F";
        
        // Find the next available counter for this year and role
        String yearPrefix = currentYear + "-";
        List<Users> existingUsers = userRepository.findByUsernameStartingWith(yearPrefix);
        
        int maxCounter = 9999; // Start from 9999 so next will be 10000
        for (Users user : existingUsers) {
            String username = user.getUsername();
            if (username.endsWith("-" + roleCode)) {
                try {
                    String counterPart = username.substring(yearPrefix.length(), username.length() - 2);
                    int counter = Integer.parseInt(counterPart);
                    maxCounter = Math.max(maxCounter, counter);
                } catch (NumberFormatException e) {
                    // Skip invalid format usernames
                }
            }
        }
        
        return currentYear + "-" + (maxCounter + 1) + "-" + roleCode;
    }

    private String generatePassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        Random random = new Random();
        StringBuilder password = new StringBuilder();
        
        for (int i = 0; i < 7; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return password.toString();
    }

    public Optional<Users> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public List<Users> getAllUsers() {
        return userRepository.findAll();
    }

    public Users updateUser(Users user) {
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public void deleteUserByStudentInfo(String firstName, String lastName) {
        Optional<Users> user = userRepository.findByFirstNameAndLastNameAndRole(firstName, lastName, UserRole.STUDENT);
        user.ifPresent(u -> userRepository.deleteById(u.getUserID()));
    }

    public void deleteUserByFacultyInfo(String firstName, String lastName) {
        Optional<Users> user = userRepository.findByFirstNameAndLastNameAndRole(firstName, lastName, UserRole.FACULTY);
        user.ifPresent(u -> userRepository.deleteById(u.getUserID()));
    }

    public Optional<Users> getUserByStudentInfo(String firstName, String lastName) {
        return userRepository.findByFirstNameAndLastNameAndRole(firstName, lastName, UserRole.STUDENT);
    }

    public Optional<Users> getUserByFacultyInfo(String firstName, String lastName) {
        return userRepository.findByFirstNameAndLastNameAndRole(firstName, lastName, UserRole.FACULTY);
    }

    /**
     * Get user by username for authentication purposes
     */
    public Optional<Users> getUserByUsername(String username) {
        Users user = userRepository.findByUsername(username);
        return Optional.ofNullable(user);
    }

    /**
     * Validate if a user exists and is active
     */
    public boolean isUserActive(Long userId) {
        Optional<Users> user = userRepository.findById(userId);
        return user.isPresent(); // Add more complex validation if needed
    }

    /**
     * Get all students for administrative purposes
     */
    public List<Users> getAllStudents() {
        return userRepository.findAll().stream()
            .filter(user -> UserRole.STUDENT.equals(user.getRole()))
            .collect(Collectors.toList());
    }

    /**
     * Get all faculty for administrative purposes
     */
    public List<Users> getAllFaculty() {
        return userRepository.findAll().stream()
            .filter(user -> UserRole.FACULTY.equals(user.getRole()))
            .collect(Collectors.toList());
    }

    /**
     * Search users by name or email
     */
    public List<Users> searchUsers(String searchTerm) {
        return userRepository.findAll().stream()
            .filter(user -> 
                (user.getFirstName() != null && user.getFirstName().toLowerCase().contains(searchTerm.toLowerCase())) ||
                (user.getLastName() != null && user.getLastName().toLowerCase().contains(searchTerm.toLowerCase())) ||
                (user.getEmail() != null && user.getEmail().toLowerCase().contains(searchTerm.toLowerCase())) ||
                (user.getUsername() != null && user.getUsername().toLowerCase().contains(searchTerm.toLowerCase()))
            )
            .collect(Collectors.toList());
    }

    /**
     * Migrate existing plain text passwords to BCrypt encoding
     * This should be called once to fix existing user accounts
     */
    public void migratePasswordsToBCrypt() {
        List<Users> allUsers = userRepository.findAll();
        for (Users user : allUsers) {
            String password = user.getPassword();
            // Check if password is not already BCrypt encoded
            if (password != null && !password.startsWith("$2a$") && !password.startsWith("$2b$") && !password.startsWith("$2y$")) {
                String encodedPassword = passwordEncoder.encode(password);
                user.setPassword(encodedPassword);
                userRepository.save(user);
                System.out.println("Migrated password for user: " + user.getUsername());
            }
        }
    }
}
