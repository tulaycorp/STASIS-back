package com.stasis.stasis.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SemesterEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long semesterEnrollmentID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "studentID", nullable = false)
    private Student student;

    private String semester;
    private String academicYear;
    private String status;
    private LocalDate dateEnrolled;
    private int totalCredits;
    
    // Add relationship with enrolled courses to prevent sharing
    @OneToMany(mappedBy = "semesterEnrollment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<EnrolledCourse> enrolledCourses;
}