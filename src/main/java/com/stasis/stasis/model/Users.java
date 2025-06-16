package com.stasis.stasis.model;

import jakarta.persistence.*;
import lombok.*;

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

    @Enumerated(EnumType.STRING)
    private UserRole role;

    @OneToOne(optional = true)
    private SemesterEnrollment semesterEnrollment; // Updated reference

    @OneToOne(optional = true)
    private Faculty faculty;
}