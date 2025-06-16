package com.stasis.stasis.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SemesterEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long semesterEnrollmentID;

    @ManyToOne
    @JoinColumn(name = "studentID")
    private Student student;

    private String semester;
    private String academicYear;
    private String status;
    private LocalDate dateEnrolled;
    private int totalCredits; 
}