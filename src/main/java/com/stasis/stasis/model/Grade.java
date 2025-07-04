package com.stasis.stasis.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Grade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long gradeID;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal gradeValue; // Using BigDecimal for precise decimal handling
    
    private LocalDate gradeDate;
    
    // Grade components moved from EnrolledCourse
    private Double midtermGrade;
    private Double finalGrade;
    private Double overallGrade;
    private String remark;

    // Note: Removed back-reference to EnrolledCourse to prevent circular references
    // The relationship is managed from the EnrolledCourse side only
}