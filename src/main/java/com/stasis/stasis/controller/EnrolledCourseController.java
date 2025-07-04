package com.stasis.stasis.controller;

import com.stasis.stasis.model.EnrolledCourse;
import com.stasis.stasis.model.Grade;
import com.stasis.stasis.dto.EnrolledCourseResponseDTO;
import com.stasis.stasis.service.EnrolledCourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/enrolled-courses")
@CrossOrigin(origins = "http://localhost:3000")
public class EnrolledCourseController {

    @Autowired
    private EnrolledCourseService enrolledCourseService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<EnrolledCourse> getAllEnrolledCourses() {
        return enrolledCourseService.getAllEnrolledCourses();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT', 'FACULTY', 'ADMIN')")
    public ResponseEntity<EnrolledCourse> getEnrolledCourseById(@PathVariable Long id) {
        return enrolledCourseService.getEnrolledCourseById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/semester-enrollment/{semesterEnrollmentId}")
    @PreAuthorize("hasAnyRole('STUDENT', 'FACULTY', 'ADMIN')")
    public ResponseEntity<List<EnrolledCourse>> getEnrolledCoursesBySemesterEnrollment(
            @PathVariable Long semesterEnrollmentId) {
        // Note: You might want to inject SemesterEnrollmentService to get the SemesterEnrollment object
        // For now, this endpoint signature is prepared but would need the actual SemesterEnrollment object
        return ResponseEntity.ok().build(); // Placeholder - needs SemesterEnrollment object
    }

    @GetMapping("/student/{studentId}")
    // @PreAuthorize("hasRole('ADMIN') or (hasRole('STUDENT') and @securityService.isCurrentUser(#studentId))")
    public ResponseEntity<List<EnrolledCourseResponseDTO>> getEnrolledCoursesByStudent(@PathVariable Long studentId) {
        System.out.println("EnrolledCourseController: Requesting enrolled courses for student ID: " + studentId);
        
        // Debug authentication
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            System.out.println("EnrolledCourseController: No authentication found!");
        } else {
            System.out.println("EnrolledCourseController: Authentication - Name: " + auth.getName() + 
                             ", Authenticated: " + auth.isAuthenticated() + 
                             ", Authorities: " + auth.getAuthorities());
        }
        
        // Use the data isolation method and convert to DTO
        List<EnrolledCourse> enrolledCourses = enrolledCourseService.getEnrolledCoursesByStudentWithIsolation(studentId);
        
        List<EnrolledCourseResponseDTO> responseDTOs = enrolledCourses.stream()
            .map(this::convertToDTO)
            .collect(java.util.stream.Collectors.toList());
        
        System.out.println("EnrolledCourseController: Found " + responseDTOs.size() + " enrolled courses for student ID: " + studentId);
        return ResponseEntity.ok(responseDTOs);
    }
    
    private EnrolledCourseResponseDTO convertToDTO(EnrolledCourse enrolledCourse) {
        EnrolledCourseResponseDTO.EnrolledCourseResponseDTOBuilder builder = EnrolledCourseResponseDTO.builder()
            .enrolledCourseID(enrolledCourse.getEnrolledCourseID())
            .status(enrolledCourse.getStatus());
        
        // Initialize default values
        Long courseId = null;
        String courseCode = "N/A";
        String courseDescription = "Unknown Course";
        Integer credits = 0;
        String startTime = null;
        String endTime = null;
        String day = "TBA";
        String room = "TBA";
        
        // Add course and schedule information from section
        if (enrolledCourse.getSection() != null) {
            // First, try to get course info from schedules (new structure)
            if (enrolledCourse.getSection().getSchedules() != null && 
                !enrolledCourse.getSection().getSchedules().isEmpty()) {
                
                // Find the first schedule with course information
                var primarySchedule = enrolledCourse.getSection().getSchedules().stream()
                    .filter(schedule -> schedule.getCourse() != null)
                    .findFirst();
                
                if (primarySchedule.isPresent()) {
                    var schedule = primarySchedule.get();
                    var course = schedule.getCourse();
                    
                    courseId = course.getId();
                    courseCode = course.getCourseCode();
                    courseDescription = course.getCourseDescription();
                    credits = course.getCredits();
                    
                    // Add schedule information from the primary schedule
                    startTime = schedule.getStartTime() != null ? schedule.getStartTime().toString() : null;
                    endTime = schedule.getEndTime() != null ? schedule.getEndTime().toString() : null;
                    day = schedule.getDay();
                    room = schedule.getRoom();
                } else {
                    // If no schedule has course info, use the first schedule for timing info
                    var firstSchedule = enrolledCourse.getSection().getSchedules().get(0);
                    startTime = firstSchedule.getStartTime() != null ? firstSchedule.getStartTime().toString() : null;
                    endTime = firstSchedule.getEndTime() != null ? firstSchedule.getEndTime().toString() : null;
                    day = firstSchedule.getDay();
                    room = firstSchedule.getRoom();
                }
            }
        }
        
        // Set the course and schedule information
        builder.courseId(courseId)
               .courseCode(courseCode)
               .courseDescription(courseDescription)
               .credits(credits)
               .startTime(startTime)
               .endTime(endTime)
               .day(day)
               .room(room);
        
        // Add section information
        if (enrolledCourse.getSection() != null) {
            builder.sectionName(enrolledCourse.getSection().getSectionName());
            
            // Add faculty information
            if (enrolledCourse.getSection().getFaculty() != null) {
                String facultyName = enrolledCourse.getSection().getFaculty().getFirstName() + " " + 
                                   enrolledCourse.getSection().getFaculty().getLastName();
                builder.faculty(facultyName);
            }
        }
        
        // Add semester information
        if (enrolledCourse.getSemesterEnrollment() != null) {
            builder.semester(enrolledCourse.getSemesterEnrollment().getSemester())
                   .academicYear(enrolledCourse.getSemesterEnrollment().getAcademicYear());
        }
        
        // Add grade information
        if (enrolledCourse.getGrade() != null) {
            Grade grade = enrolledCourse.getGrade();
            
            // Convert grade value to letter grade
            String letterGrade = convertToLetterGrade(grade.getGradeValue());
            
            builder.grade(letterGrade)
                   .gradeValue(grade.getGradeValue() != null ? grade.getGradeValue().doubleValue() : null)
                   .midtermGrade(grade.getMidtermGrade())
                   .finalGrade(grade.getFinalGrade())
                   .overallGrade(grade.getOverallGrade())
                   .remark(grade.getRemark());
        }
        
        return builder.build();
    }
    
    private String convertToLetterGrade(java.math.BigDecimal gradeValue) {
        if (gradeValue == null) return null;
        
        double value = gradeValue.doubleValue();
        if (value >= 97) return "A+";
        else if (value >= 93) return "A";
        else if (value >= 90) return "A-";
        else if (value >= 87) return "B+";
        else if (value >= 83) return "B";
        else if (value >= 80) return "B-";
        else if (value >= 77) return "C+";
        else if (value >= 73) return "C";
        else if (value >= 70) return "C-";
        else if (value >= 67) return "D+";
        else if (value >= 60) return "D";
        else return "F";
    }

    @GetMapping("/section/{sectionId}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<List<EnrolledCourse>> getEnrolledCoursesBySection(@PathVariable Long sectionId) {
        List<EnrolledCourse> enrolledCourses = enrolledCourseService.getEnrolledCoursesBySection(sectionId);
        return ResponseEntity.ok(enrolledCourses);
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<EnrolledCourse> enrollInCourse(@RequestBody Map<String, Object> payload) {
        Long studentId = Long.valueOf(payload.get("studentId").toString());
        Long courseSectionId = Long.valueOf(payload.get("courseSectionId").toString());
        String status = payload.get("status") != null ? payload.get("status").toString() : "Enrolled";
        EnrolledCourse enrolled = enrolledCourseService.studentEnrollInCourse(studentId, courseSectionId, status);
        return ResponseEntity.ok(enrolled);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<EnrolledCourse> updateEnrolledCourse(@PathVariable Long id, @RequestBody EnrolledCourse enrolledCourse) {
        try {
            return ResponseEntity.ok(enrolledCourseService.updateEnrolledCourse(id, enrolledCourse));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("permitAll()")  // Temporarily allow all access until authentication is fixed
    public ResponseEntity<Void> deleteEnrolledCourse(@PathVariable Long id, 
                                                     @RequestHeader(value = "X-Student-ID", required = false) String studentIdHeader) {
        System.out.println("EnrolledCourseController: Delete request for enrollment ID: " + id);
        
        // Application-level security check: only allow deletion if student ID matches enrollment
        if (studentIdHeader != null) {
            try {
                Long requestingStudentId = Long.valueOf(studentIdHeader);
                
                // Check if enrollment belongs to requesting student
                Optional<EnrolledCourse> enrollmentOpt = enrolledCourseService.getEnrolledCourseById(id);
                if (enrollmentOpt.isPresent()) {
                    Long enrollmentStudentId = enrollmentOpt.get().getSemesterEnrollment().getStudent().getId();
                    if (!requestingStudentId.equals(enrollmentStudentId)) {
                        System.out.println("EnrolledCourseController: Student " + requestingStudentId + 
                                         " attempted to delete enrollment belonging to student " + enrollmentStudentId);
                        return ResponseEntity.status(403).build(); // Forbidden
                    }
                } else {
                    return ResponseEntity.notFound().build();
                }
            } catch (NumberFormatException e) {
                System.out.println("EnrolledCourseController: Invalid student ID header: " + studentIdHeader);
                return ResponseEntity.badRequest().build();
            }
        }
        
        // Debug authentication
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            System.out.println("EnrolledCourseController: No authentication found for delete!");
        } else {
            System.out.println("EnrolledCourseController: Delete Authentication - Name: " + auth.getName() + 
                             ", Authenticated: " + auth.isAuthenticated() + 
                             ", Authorities: " + auth.getAuthorities());
        }
        
        enrolledCourseService.deleteEnrolledCourse(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<String> updateEnrollmentStatus(@PathVariable Long id, @RequestParam String status) {
        boolean updated = enrolledCourseService.updateEnrollmentStatus(id, status);
        if (updated) {
            return ResponseEntity.ok("Enrollment status updated successfully");
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/grades")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<EnrolledCourse> updateGrades(@PathVariable Long id, @RequestBody Map<String, Object> gradeData) {
        try {
            EnrolledCourse updated = enrolledCourseService.updateGrades(id, gradeData);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/midterm-grade")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<EnrolledCourse> updateMidtermGrade(@PathVariable Long id, @RequestBody Map<String, Object> gradeData) {
        try {
            Double midtermGrade = Double.valueOf(gradeData.get("midtermGrade").toString());
            EnrolledCourse updated = enrolledCourseService.updateMidtermGrade(id, midtermGrade);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/final-grade")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<EnrolledCourse> updateFinalGrade(@PathVariable Long id, @RequestBody Map<String, Object> gradeData) {
        try {
            Double finalGrade = Double.valueOf(gradeData.get("finalGrade").toString());
            EnrolledCourse updated = enrolledCourseService.updateFinalGrade(id, finalGrade);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/overall-grade")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<EnrolledCourse> updateOverallGrade(@PathVariable Long id, @RequestBody Map<String, Object> gradeData) {
        try {
            Double overallGrade = Double.valueOf(gradeData.get("overallGrade").toString());
            EnrolledCourse updated = enrolledCourseService.updateOverallGrade(id, overallGrade);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/faculty/{facultyId}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('FACULTY') and @securityService.isCurrentFaculty(#facultyId))")
    public ResponseEntity<List<EnrolledCourse>> getEnrolledCoursesByFaculty(@PathVariable Long facultyId) {
        List<EnrolledCourse> enrolledCourses = enrolledCourseService.getEnrolledCoursesByFaculty(facultyId);
        return ResponseEntity.ok(enrolledCourses);
    }

    @GetMapping("/faculty/{facultyId}/program/{programId}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('FACULTY') and @securityService.isCurrentFaculty(#facultyId))")
    public ResponseEntity<List<EnrolledCourse>> getEnrolledCoursesByFacultyAndProgram(
            @PathVariable Long facultyId, 
            @PathVariable Long programId) {
        List<EnrolledCourse> enrolledCourses = enrolledCourseService.getEnrolledCoursesByFacultyAndProgram(facultyId, programId);
        return ResponseEntity.ok(enrolledCourses);
    }

    @GetMapping("/course/{courseId}/students")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<List<EnrolledCourse>> getEnrolledStudentsByCourse(@PathVariable Long courseId) {
        List<EnrolledCourse> enrolledCourses = enrolledCourseService.getEnrolledCoursesByCourse(courseId);
        return ResponseEntity.ok(enrolledCourses);

        
    }


}
