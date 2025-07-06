package com.stasis.stasis.controller;

import com.stasis.stasis.dto.FacultyGradeResponseDTO;
import com.stasis.stasis.model.CourseSection;
import com.stasis.stasis.model.EnrolledCourse;
import com.stasis.stasis.service.CourseSectionService;
import com.stasis.stasis.service.EnrolledCourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller for faculty grade management operations
 */
@RestController
@RequestMapping("/api/faculty-grades")
public class FacultyGradesController {

    @Autowired
    private CourseSectionService courseSectionService;

    @Autowired
    private EnrolledCourseService enrolledCourseService;

    /**
     * Get all sections assigned to a faculty member with grade summary information
     */
    @GetMapping("/faculty/{facultyId}/sections")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<List<FacultyGradeResponseDTO>> getFacultySections(@PathVariable Long facultyId) {
        
        // Debug authentication
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("FacultyGradesController: Authentication - Name: " + 
                          (auth != null ? auth.getName() : "null") + 
                          ", Authorities: " + (auth != null ? auth.getAuthorities() : "null"));
        
        try {
            System.out.println("FacultyGradesController: Fetching sections for faculty ID: " + facultyId);
            
            // Get all sections assigned to this faculty
            List<CourseSection> facultySections = courseSectionService.getSectionsByFaculty(facultyId);
            System.out.println("FacultyGradesController: Found " + facultySections.size() + " sections for faculty");
            
            // Convert to response DTOs with grade summary information
            List<FacultyGradeResponseDTO> response = facultySections.stream()
                .map(section -> {
                    System.out.println("Processing section: " + section.getSectionID() + " - " + section.getSectionName());
                    
                    // Get enrolled students count for this section
                    List<EnrolledCourse> enrolledCourses = enrolledCourseService.getEnrolledCoursesBySection(section.getSectionID());
                    int enrolledCount = enrolledCourses.size();
                    
                    // Count students with grades
                    int studentsWithGrades = (int) enrolledCourses.stream()
                        .filter(enrollment -> enrollment.getGrade() != null)
                        .count();
                    
                    // Extract course information - handle both old and new structure
                    String courseCode = "N/A";
                    String courseDescription = "Unknown Course";
                    
                    // Try to get course info from schedules first (new structure)
                    if (section.getSchedules() != null && !section.getSchedules().isEmpty()) {
                        var firstScheduleWithCourse = section.getSchedules().stream()
                            .filter(schedule -> schedule.getCourse() != null)
                            .findFirst();
                        
                        if (firstScheduleWithCourse.isPresent()) {
                            var course = firstScheduleWithCourse.get().getCourse();
                            courseCode = course.getCourseCode();
                            courseDescription = course.getCourseDescription();
                        }
                    }
                    
                    System.out.println("Section " + section.getSectionID() + ": " + 
                                     enrolledCount + " enrolled, " + 
                                     studentsWithGrades + " with grades");
                    
                    return FacultyGradeResponseDTO.builder()
                        .sectionId(section.getSectionID())
                        .sectionName(section.getSectionName())
                        .courseCode(courseCode)
                        .courseDescription(courseDescription)
                        .enrolledStudentsCount(enrolledCount)
                        .studentsWithGrades(studentsWithGrades)
                        .build();
                })
                .collect(Collectors.toList());
            
            System.out.println("FacultyGradesController: Returning " + response.size() + " section summaries");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("FacultyGradesController: Error fetching faculty sections: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get detailed enrolled students for a specific section
     */
    @GetMapping("/section/{sectionId}/students")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getSectionStudents(@PathVariable Long sectionId) {
        
        try {
            System.out.println("FacultyGradesController: Fetching students for section ID: " + sectionId);
            
            List<EnrolledCourse> enrolledCourses = enrolledCourseService.getEnrolledCoursesBySection(sectionId);
            System.out.println("FacultyGradesController: Found " + enrolledCourses.size() + " enrolled students");
            
            // Convert to simple map structure to avoid circular reference issues
            List<Map<String, Object>> studentData = enrolledCourses.stream()
                .map(enrollment -> {
                    Map<String, Object> student = new HashMap<>();
                    
                    // Basic enrollment info
                    student.put("enrolledCourseID", enrollment.getEnrolledCourseID());
                    student.put("status", enrollment.getStatus());
                    
                    // Student information
                    if (enrollment.getSemesterEnrollment() != null && 
                        enrollment.getSemesterEnrollment().getStudent() != null) {
                        var studentEntity = enrollment.getSemesterEnrollment().getStudent();
                        
                        student.put("id", studentEntity.getId());
                        student.put("firstName", studentEntity.getFirstName());
                        student.put("lastName", studentEntity.getLastName());
                        student.put("email", studentEntity.getEmail());
                        student.put("yearLevel", studentEntity.getYear_level());
                        
                        // Program information
                        if (studentEntity.getProgram() != null) {
                            student.put("programName", studentEntity.getProgram().getProgramName());
                        }
                    }
                    
                    // Semester enrollment info
                    if (enrollment.getSemesterEnrollment() != null) {
                        student.put("semesterEnrollmentID", enrollment.getSemesterEnrollment().getSemesterEnrollmentID());
                        student.put("semester", enrollment.getSemesterEnrollment().getSemester());
                        student.put("academicYear", enrollment.getSemesterEnrollment().getAcademicYear());
                    }
                    
                    // Grade information
                    if (enrollment.getGrade() != null) {
                        var grade = enrollment.getGrade();
                        student.put("midtermGrade", grade.getMidtermGrade());
                        student.put("finalGrade", grade.getFinalGrade());
                        student.put("overallGrade", grade.getOverallGrade());
                        student.put("remark", grade.getRemark());
                        student.put("gradeValue", grade.getGradeValue());
                    } else {
                        student.put("midtermGrade", null);
                        student.put("finalGrade", null);
                        student.put("overallGrade", null);
                        student.put("remark", "INCOMPLETE");
                        student.put("gradeValue", null);
                    }
                    
                    return student;
                })
                .collect(Collectors.toList());
            
            System.out.println("FacultyGradesController: Successfully converted " + studentData.size() + " students to DTOs");
            return ResponseEntity.ok(studentData);
            
        } catch (Exception e) {
            System.err.println("FacultyGradesController: Error fetching section students: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Update midterm grade for a student enrollment
     */
    @PutMapping("/enrollment/{enrollmentId}/midterm-grade")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<?> updateMidtermGrade(
            @PathVariable Long enrollmentId, 
            @RequestBody Map<String, Object> gradeData) {
        
        try {
            System.out.println("FacultyGradesController: Updating midterm grade for enrollment: " + enrollmentId);
            
            Double midtermGrade = Double.valueOf(gradeData.get("midtermGrade").toString());
            
            EnrolledCourse updatedEnrollment = enrolledCourseService.updateMidtermGrade(enrollmentId, midtermGrade);
            
            if (updatedEnrollment != null) {
                System.out.println("FacultyGradesController: Successfully updated midterm grade");
                return ResponseEntity.ok(updatedEnrollment);
            } else {
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            System.err.println("FacultyGradesController: Error updating midterm grade: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error updating grade: " + e.getMessage());
        }
    }

    /**
     * Update final grade for a student enrollment
     */
    @PutMapping("/enrollment/{enrollmentId}/final-grade")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<?> updateFinalGrade(
            @PathVariable Long enrollmentId, 
            @RequestBody Map<String, Object> gradeData) {
        
        try {
            System.out.println("FacultyGradesController: Updating final grade for enrollment: " + enrollmentId);
            
            Double finalGrade = Double.valueOf(gradeData.get("finalGrade").toString());
            
            EnrolledCourse updatedEnrollment = enrolledCourseService.updateFinalGrade(enrollmentId, finalGrade);
            
            if (updatedEnrollment != null) {
                System.out.println("FacultyGradesController: Successfully updated final grade");
                return ResponseEntity.ok(updatedEnrollment);
            } else {
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            System.err.println("FacultyGradesController: Error updating final grade: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error updating grade: " + e.getMessage());
        }
    }

    /**
     * Update complete grade information for a student enrollment
     */
    @PutMapping("/enrollment/{enrollmentId}/grades")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<?> updateGrades(
            @PathVariable Long enrollmentId, 
            @RequestBody Map<String, Object> gradeData) {
        
        System.out.println("=== FacultyGradesController.updateGrades START ===");
        System.out.println("Enrollment ID: " + enrollmentId);
        System.out.println("Grade data received: " + gradeData);
        
        try {
            // Validate input parameters
            if (enrollmentId == null) {
                System.err.println("Enrollment ID is null");
                return ResponseEntity.badRequest().body("Enrollment ID cannot be null");
            }
            
            if (gradeData == null || gradeData.isEmpty()) {
                System.err.println("Grade data is null or empty");
                return ResponseEntity.badRequest().body("Grade data cannot be null or empty");
            }
            
            // Debug authentication
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            System.out.println("Authentication: " + (auth != null ? auth.getName() : "null"));
            System.out.println("Authorities: " + (auth != null ? auth.getAuthorities() : "null"));
            
            System.out.println("Calling service method...");
            
            // Use the service method that accepts Map<String, Object>
            EnrolledCourse updatedEnrollment = enrolledCourseService.updateGrades(enrollmentId, gradeData);
            
            System.out.println("Service method completed successfully");
            
            if (updatedEnrollment != null) {
                System.out.println("Successfully updated grades for enrollment: " + enrollmentId);
                return ResponseEntity.ok(updatedEnrollment);
            } else {
                System.err.println("Service returned null - enrollment not found");
                return ResponseEntity.notFound().build();
            }
            
        } catch (SecurityException e) {
            System.err.println("Security error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(403).body("Access denied: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            System.err.println("Invalid argument: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Invalid data: " + e.getMessage());
        } catch (RuntimeException e) {
            System.err.println("Runtime error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Unexpected error: " + e.getMessage());
        } finally {
            System.out.println("=== FacultyGradesController.updateGrades END ===");
        }
    }

    /**
     * Bulk update grades for multiple enrollments
     */
    @PutMapping("/bulk-update-grades")
    @PreAuthorize("hasRole('FACULTY') or hasRole('ADMIN')")
    public ResponseEntity<?> bulkUpdateGrades(@RequestBody List<Map<String, Object>> gradeUpdates) {
        
        try {
            System.out.println("FacultyGradesController: Bulk updating grades for " + gradeUpdates.size() + " enrollments");
            
            for (Map<String, Object> gradeUpdate : gradeUpdates) {
                Long enrollmentId = Long.valueOf(gradeUpdate.get("enrollmentId").toString());
                
                // Remove enrollmentId from the grade data map
                Map<String, Object> gradeData = new HashMap<>(gradeUpdate);
                gradeData.remove("enrollmentId");
                
                enrolledCourseService.updateGrades(enrollmentId, gradeData);
            }
            
            System.out.println("FacultyGradesController: Successfully completed bulk grade update");
            return ResponseEntity.ok().body("Grades updated successfully");
            
        } catch (Exception e) {
            System.err.println("FacultyGradesController: Error in bulk grade update: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error updating grades: " + e.getMessage());
        }
    }
}
