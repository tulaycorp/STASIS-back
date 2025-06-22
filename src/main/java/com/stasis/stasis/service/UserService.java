package com.stasis.stasis.service;

import com.stasis.stasis.model.Users;
import com.stasis.stasis.model.UserRole;
import com.stasis.stasis.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class UserService {
    
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Users createUser(Users user) {
        return userRepository.save(user);
    }

    public Users createUserWithGeneratedCredentials(String firstName, String lastName, UserRole role) {
        String username = generateUsername(role);
        String password = generatePassword();
        
        Users user = Users.builder()
                .username(username)
                .password(password) // In production, this should be hashed
                .firstName(firstName)
                .lastName(lastName)
                .role(role)
                .build();
        
        return userRepository.save(user);
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
}
