package com.stasis.stasis.model;

import jakarta.persistence.*;
import lombok.*;


@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Data
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;

     private String firstName;
     private String lastName;
     private String email;
     private String dateOfBirth;
     private int year_level;

     @ManyToOne
     @JoinColumn(name = "programID")
     private Program program;
}