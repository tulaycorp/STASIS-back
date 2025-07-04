package com.stasis.stasis.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO for faculty grade response showing class summaries
 */
@Data
@Builder
public class FacultyGradeResponseDTO {
    
    // Section information
    private Long sectionId;
    private String sectionName;
    
    // Course information
    private String courseCode;
    private String courseDescription;
    
    // Statistics
    private Integer enrolledStudentsCount;
    private Integer studentsWithGrades;
}
