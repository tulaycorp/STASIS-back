package com.stasis.stasis.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

/**
 * DTO for student grade information used by faculty
 */
@Data
@Builder
public class StudentGradeDTO {
    
    // Enrollment information
    private Long enrollmentId;
    private String enrollmentStatus;
    
    // Student information
    private Long studentId;
    private String studentName;
    private String studentNumber;
    
    // Course and section information
    private Long sectionId;
    private String sectionName;
    private String courseCode;
    private String courseDescription;
    private Integer credits;
    
    // Grade information
    private Double midtermGrade;
    private Double finalGrade;
    private Double overallGrade;
    private Double gradeValue;
    private String letterGrade;
    private String remark;
    private LocalDate gradeDate;
}
