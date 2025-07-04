package com.stasis.stasis.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class EnrolledCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long enrolledCourseID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semesterEnrollmentID", nullable = false)
    private SemesterEnrollment semesterEnrollment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sectionID", nullable = false)
    private CourseSection section;

    private String status;

    // Each enrolled course should have its own unique grade
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "gradeID", nullable = true, unique = true)
    private Grade grade;
}