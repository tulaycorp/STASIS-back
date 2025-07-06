package com.stasis.stasis.controller;

import com.stasis.stasis.dto.LoginRequest;
import com.stasis.stasis.dto.LoginResponse;
import com.stasis.stasis.model.Users;
import com.stasis.stasis.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;
    
    @Autowired
    private SecurityContextRepository securityContextRepository;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticateUser(@RequestBody LoginRequest loginRequest, 
                                                         HttpServletRequest request, 
                                                         HttpServletResponse response) {
        try {
            LoginResponse loginResponse = authService.loginUser(loginRequest);
            if (loginResponse.isSuccess()) {
                // Get the current security context that was set by AuthService
                SecurityContext securityContext = SecurityContextHolder.getContext();
                Authentication authentication = securityContext.getAuthentication();
                
                if (authentication != null && authentication.isAuthenticated()) {
                    // Save the security context to the session using the configured repository
                    securityContextRepository.saveContext(securityContext, request, response);
                    
                    System.out.println("Auth: SecurityContext saved to session");
                    System.out.println("Auth: Authentication principal: " + authentication.getPrincipal());
                    System.out.println("Auth: Authentication authorities: " + authentication.getAuthorities());
                } else {
                    System.out.println("Auth: Warning - No valid authentication found in SecurityContext");
                }
                
                // Also create session for additional verification
                HttpSession session = request.getSession(true);
                session.setAttribute("AUTHENTICATED_USER", loginResponse.getUsername());
                session.setAttribute("USER_ROLE", loginResponse.getRole());
                System.out.println("Auth: Session created with ID: " + session.getId());
                
                return ResponseEntity.ok(loginResponse);
            } else {
                return ResponseEntity.status(401).body(loginResponse);
            }
        } catch (Exception e) {
            System.err.println("Auth: Login error - " + e.getMessage());
            e.printStackTrace();
            LoginResponse errorResponse = LoginResponse.builder()
                .success(false)
                .message("An error occurred during authentication")
                .build();
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<LoginResponse> logoutUser() {
        try {
            LoginResponse logoutResponse = authService.logoutUser();
            return ResponseEntity.ok(logoutResponse);
        } catch (Exception e) {
            LoginResponse errorResponse = LoginResponse.builder()
                .success(false)
                .message("An error occurred during logout")
                .build();
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/check")
    public ResponseEntity<LoginResponse> checkAuthentication() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            System.out.println("Auth check - Authentication object: " + authentication);
            System.out.println("Auth check - Is authenticated: " + (authentication != null ? authentication.isAuthenticated() : "null"));
            System.out.println("Auth check - Principal: " + (authentication != null ? authentication.getPrincipal() : "null"));
            System.out.println("Auth check - Authorities: " + (authentication != null ? authentication.getAuthorities() : "null"));
            
            if (authentication == null || !authentication.isAuthenticated() || 
                authentication.getPrincipal().equals("anonymousUser")) {
                System.out.println("Auth check failed - Not authenticated");
                return ResponseEntity.status(401).body(LoginResponse.builder()
                    .success(false)
                    .message("Not authenticated")
                    .build());
            }

            // Get current user info
            String username = authentication.getName();
            System.out.println("Auth check - Username from authentication: " + username);
            Users currentUser = authService.getCurrentUserByUsername(username);
            
            if (currentUser == null) {
                System.out.println("Auth check failed - User not found for username: " + username);
                return ResponseEntity.status(401).body(LoginResponse.builder()
                    .success(false)
                    .message("User not found")
                    .build());
            }

            LoginResponse response = LoginResponse.builder()
                .success(true)
                .message("Authenticated")
                .userId(currentUser.getUserID())
                .username(currentUser.getUsername())
                .firstName(currentUser.getFirstName())
                .lastName(currentUser.getLastName())
                .role(currentUser.getRole())
                .status(currentUser.getStatus())
                .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(LoginResponse.builder()
                .success(false)
                .message("Error checking authentication")
                .build());
        }
    }

    @GetMapping("/debug")
    public ResponseEntity<?> debugAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        Map<String, Object> debugInfo = new HashMap<>();
        debugInfo.put("authentication", authentication != null ? authentication.toString() : "null");
        debugInfo.put("isAuthenticated", authentication != null ? authentication.isAuthenticated() : false);
        debugInfo.put("principal", authentication != null ? authentication.getPrincipal().toString() : "null");
        debugInfo.put("authorities", authentication != null ? authentication.getAuthorities().toString() : "null");
        debugInfo.put("name", authentication != null ? authentication.getName() : "null");
        
        return ResponseEntity.ok(debugInfo);
    }
}
