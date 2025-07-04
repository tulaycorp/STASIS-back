package com.stasis.stasis.service;

import com.stasis.stasis.model.Users;
import com.stasis.stasis.model.UserRole;
import com.stasis.stasis.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Order(1) // Run before PasswordEncodingMigration
public class DataInitializationService implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeAdminUser();
        initializeSimpleAdminUser();
    }

    private void initializeAdminUser() {
        // Check if admin user already exists
        Users existingAdmin = userRepository.findByUsername("Superadmin");
        
        if (existingAdmin == null) {
            // Create the super admin user with encoded password
            Users adminUser = Users.builder()
                .username("Superadmin")
                .password(passwordEncoder.encode("admin123")) // Encode the password immediately
                .firstName("Stasis")
                .lastName("Admin")
                .role(UserRole.ADMIN)
                .status("active")
                .createdAt(LocalDateTime.now())
                .build();
            
            userRepository.save(adminUser);
            System.out.println("Super Admin user created successfully:");
            System.out.println("Username: Superadmin");
            System.out.println("Password: admin123 (encoded)");
            System.out.println("Name: Stasis Admin");
        } else {
            System.out.println("Super Admin user already exists in the database.");
            
            // Check if the existing password needs encoding
            if (existingAdmin.getPassword() != null && !existingAdmin.getPassword().startsWith("$2")) {
                existingAdmin.setPassword(passwordEncoder.encode("admin123"));
                userRepository.save(existingAdmin);
                System.out.println("Updated Super Admin password encoding.");
            }
        }
    }
    
    private void initializeSimpleAdminUser() {
        // Check if simple admin user already exists
        Users existingAdmin = userRepository.findByUsername("admin");
        
        if (existingAdmin == null) {
            // Create a simple admin user with encoded password
            Users adminUser = Users.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123")) // Encode the password immediately
                .firstName("Admin")
                .lastName("User")
                .role(UserRole.ADMIN)
                .status("active")
                .createdAt(LocalDateTime.now())
                .build();
            
            userRepository.save(adminUser);
            System.out.println("Simple Admin user created successfully:");
            System.out.println("Username: admin");
            System.out.println("Password: admin123 (encoded)");
            System.out.println("Name: Admin User");
        } else {
            System.out.println("Simple Admin user already exists in the database.");
            
            // Check if the existing password needs encoding
            if (existingAdmin.getPassword() != null && !existingAdmin.getPassword().startsWith("$2")) {
                existingAdmin.setPassword(passwordEncoder.encode("admin123"));
                userRepository.save(existingAdmin);
                System.out.println("Updated Simple Admin password encoding.");
            }
        }
    }
}
