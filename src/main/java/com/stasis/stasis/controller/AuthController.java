package com.stasis.stasis.controller;

import com.stasis.stasis.dto.LoginRequest;
import com.stasis.stasis.dto.LoginResponse;
import com.stasis.stasis.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse loginResponse = authService.loginUser(loginRequest);
            if (loginResponse.isSuccess()) {
                return ResponseEntity.ok(loginResponse);
            } else {
                return ResponseEntity.status(401).body(loginResponse);
            }
        } catch (Exception e) {
            LoginResponse errorResponse = LoginResponse.builder()
                .success(false)
                .message("An error occurred during authentication")
                .build();
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
