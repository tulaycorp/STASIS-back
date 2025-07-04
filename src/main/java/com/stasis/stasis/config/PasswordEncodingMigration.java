package com.stasis.stasis.config;

import com.stasis.stasis.model.Users;
import com.stasis.stasis.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * This component will run on application startup to encode any plaintext passwords
 * in the database using BCrypt. This is needed for the migration to Spring Security.
 * 
 * Note: This runs AFTER DataInitializationService (Order 2) to avoid conflicts.
 */
@Component
@Order(2) // Run after DataInitializationService
public class PasswordEncodingMigration implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Starting password encoding migration...");
        
        List<Users> users = userRepository.findAll();
        int encodedCount = 0;
        
        for (Users user : users) {
            String currentPassword = user.getPassword();
            
            // Check if password is already encoded (BCrypt hashes start with $2a$, $2b$, or $2y$)
            if (currentPassword != null && !currentPassword.startsWith("$2")) {
                String encodedPassword = passwordEncoder.encode(currentPassword);
                user.setPassword(encodedPassword);
                userRepository.save(user);
                System.out.println("Encoded password for user: " + user.getUsername());
                encodedCount++;
            }
        }
        
        System.out.println("Password encoding migration completed. Encoded " + encodedCount + " passwords.");
    }
}
