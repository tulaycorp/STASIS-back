package com.stasis.stasis.service;

import com.stasis.stasis.model.Users;
import com.stasis.stasis.model.UserRole;
import com.stasis.stasis.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class DataInitializationService implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        initializeAdminUser();
    }

    private void initializeAdminUser() {
        // Check if admin user already exists
        Users existingAdmin = userRepository.findByUsername("Superadmin");
        
        if (existingAdmin == null) {
            // Create the super admin user
            Users adminUser = Users.builder()
                .username("Superadmin")
                .password("admin123") // In production, this should be encrypted
                .firstName("Stasis")
                .lastName("Admin")
                .role(UserRole.ADMIN)
                .status("active")
                .createdAt(LocalDateTime.now())
                .build();
            
            userRepository.save(adminUser);
            System.out.println("Super Admin user created successfully:");
            System.out.println("Username: Superadmin");
            System.out.println("Password: admin123");
            System.out.println("Name: Stasis Admin");
        } else {
            System.out.println("Super Admin user already exists in the database.");
        }
    }
}
