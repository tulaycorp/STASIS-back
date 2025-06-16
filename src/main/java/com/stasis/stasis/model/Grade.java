package com.stasis.stasis.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Grade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long gradeID;

    @OneToOne
    @JoinColumn(name = "enrolledCourseID")
    private EnrolledCourse enrolledCourse;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal gradeValue; // Using BigDecimal for precise decimal handling
    
    private LocalDate gradeDate;
}