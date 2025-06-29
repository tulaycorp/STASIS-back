package com.stasis.stasis.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userID;

    private String username;
    private String password;
    private String firstName;
    private String lastName;
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime lastLogin;
    
    @Builder.Default
    private String status = "active";

    @Enumerated(EnumType.STRING)
    private UserRole role;
    private String email;

    @OneToOne(optional = true)
    private SemesterEnrollment semesterEnrollment; // Updated reference

    @OneToOne(optional = true)
    private Faculty faculty;
}
