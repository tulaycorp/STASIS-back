package com.stasis.stasis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrolledCourseResponseDTO {
    private Long enrolledCourseID;
    private String status;
    
    // Course information
    private String courseCode;
    private String courseDescription;
    private Integer credits;
    
    // Section information
    private String sectionName;
    private String faculty;
    
    // Schedule information
    private String startTime;
    private String endTime;
    private String day;
    private String room;
    
    // Semester information
    private String semester;
    private String academicYear;
    
    // Grade information (if available)
    private String grade;
    private Double gradeValue;
    private Double midtermGrade;
    private Double finalGrade;
    private Double overallGrade;
    private String remark;
}
