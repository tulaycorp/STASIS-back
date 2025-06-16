// package com.stasis.stasis.controller;

// import com.stasis.stasis.dto.LoginRequest;
// import com.stasis.stasis.dto.LoginResponse;
// import com.stasis.stasis.service.AuthService;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*; // Ensure all needed annotations are imported

// @RestController
// @RequestMapping("/api/auth") // Base path for authentication endpoints
// // Add @CrossOrigin if needed during development (if not using proxy)
// // @CrossOrigin(origins = "http://localhost:3000")
// public class AuthController {

//     @Autowired
//     private AuthService authService;

//     @PostMapping("/login")
//     public ResponseEntity<LoginResponse> authenticateUser(@RequestBody LoginRequest loginRequest) {
//         LoginResponse loginResponse = authService.loginUser(loginRequest);
//         if (loginResponse.isSuccess()) {
//             return ResponseEntity.ok(loginResponse);
//         } else {
//             // Use appropriate HTTP status for failure (e.g., 401 Unauthorized)
//             return ResponseEntity.status(401).body(loginResponse);
//         }
//     }

//     // Add other endpoints like register, logout if needed
// }