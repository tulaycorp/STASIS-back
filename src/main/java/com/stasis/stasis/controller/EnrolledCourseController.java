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
        
        // Convert each enrollment to separate DTOs for each course in the section
        List<EnrolledCourseResponseDTO> responseDTOs = enrolledCourses.stream()
            .flatMap(this::convertToMultipleDTOs)
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
    // @PreAuthorize("hasRole('STUDENT')") // Temporarily disabled for debugging
    public ResponseEntity<?> enrollInCourse(@RequestBody Map<String, Object> payload) {
        try {
            Long studentId = Long.valueOf(payload.get("studentId").toString());
            String status = payload.get("status") != null ? payload.get("status").toString() : "Enrolled";
            
            // NEW APPROACH: Always require scheduleId for course-specific enrollment
            if (payload.containsKey("scheduleId") && payload.get("scheduleId") != null) {
                Long scheduleId = Long.valueOf(payload.get("scheduleId").toString());
                System.out.println("Creating course-specific enrollment for schedule: " + scheduleId);
                EnrolledCourse enrolled = enrolledCourseService.createCourseSpecificEnrollment(studentId, scheduleId, status);
                return ResponseEntity.ok(enrolled);
            } else if (payload.containsKey("courseSectionId")) {
                // Fallback to old approach for backward compatibility
                Long courseSectionId = Long.valueOf(payload.get("courseSectionId").toString());
                System.out.println("Using legacy section-based enrollment for section: " + courseSectionId);
                EnrolledCourse enrolled = enrolledCourseService.studentEnrollInCourse(studentId, courseSectionId, status);
                return ResponseEntity.ok(enrolled);
            } else {
                throw new RuntimeException("Either scheduleId or courseSectionId must be provided");
            }
        } catch (RuntimeException e) {
            // If the error is about duplicate course enrollment, return 409 Conflict
            String msg = e.getMessage() != null ? e.getMessage() : "Enrollment failed";
            if (msg.contains("already enrolled in this course") || msg.contains("already enrolled in this specific course")) {
                return ResponseEntity.status(409).body(Map.of("error", msg));
            }
            // Otherwise, return 400 Bad Request
            return ResponseEntity.badRequest().body(Map.of("error", msg));
        }
    }

    /**
     * Enroll in a schedule (not section), ensuring no multiple schedules of the same course are enrolled.
     * Accepts: studentId, scheduleId, status
     */
    @PostMapping("/enroll-schedule")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<EnrolledCourse> enrollInSchedule(@RequestBody Map<String, Object> payload) {
        Long studentId = Long.valueOf(payload.get("studentId").toString());
        Long scheduleId = Long.valueOf(payload.get("scheduleId").toString());
        String status = payload.get("status") != null ? payload.get("status").toString() : "Enrolled";
        EnrolledCourse enrolled = enrolledCourseService.studentEnrollInSchedule(studentId, scheduleId, status);
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
                                                     @RequestHeader(value = "X-Student-ID", required = false) String studentIdHeader,
                                                     @RequestParam(value = "scheduleId", required = false) Long scheduleId) {
        System.out.println("EnrolledCourseController: Delete request for enrollment ID: " + id + 
                          (scheduleId != null ? " (specific schedule: " + scheduleId + ")" : " (entire enrollment)"));
        
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
        
        // Use the new course-specific deletion method
        boolean deleted = enrolledCourseService.deleteCourseSpecificEnrollment(id, scheduleId);
        
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
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


    /**
     * Returns all available schedules for enrollment (no filtering by course).
     * The check for only one instance of a course per student is enforced on enrollment.
     */
    @GetMapping("/available-schedules/{studentId}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<List<?>> getAvailableSchedulesForStudent(@PathVariable Long studentId) {
        List<?> availableSchedules = enrolledCourseService.getAllAvailableSchedules();
        return ResponseEntity.ok(availableSchedules);
    }

    private java.util.stream.Stream<EnrolledCourseResponseDTO> convertToMultipleDTOs(EnrolledCourse enrolledCourse) {
        // NEW: If enrollment has a specific scheduleId, only return that specific course
        if (enrolledCourse.getScheduleId() != null) {
            // Find the specific schedule this enrollment is for
            if (enrolledCourse.getSection() != null && 
                enrolledCourse.getSection().getSchedules() != null) {
                
                Optional<com.stasis.stasis.model.Schedule> targetSchedule = enrolledCourse.getSection().getSchedules().stream()
                    .filter(schedule -> schedule.getScheduleID().equals(enrolledCourse.getScheduleId()))
                    .findFirst();
                
                if (targetSchedule.isPresent()) {
                    return java.util.stream.Stream.of(convertToDTOForSpecificSchedule(enrolledCourse, targetSchedule.get()));
                } else {
                    System.out.println("Warning: Could not find schedule " + enrolledCourse.getScheduleId() + 
                                     " in section " + enrolledCourse.getSection().getSectionName());
                }
            }
        }
        
        // LEGACY: If section has multiple schedules with different courses, create separate DTOs for each
        if (enrolledCourse.getSection() != null && 
            enrolledCourse.getSection().getSchedules() != null && 
            !enrolledCourse.getSection().getSchedules().isEmpty()) {
            
            // Group schedules by course to avoid duplicates
            Map<Long, com.stasis.stasis.model.Schedule> courseToScheduleMap = enrolledCourse.getSection().getSchedules().stream()
                .filter(schedule -> schedule.getCourse() != null)
                .collect(java.util.stream.Collectors.toMap(
                    schedule -> schedule.getCourse().getId(),
                    schedule -> schedule,
                    (existing, replacement) -> existing // Keep first schedule for each course
                ));
            
            // Create separate DTO for each course
            return courseToScheduleMap.values().stream()
                .map(schedule -> convertToDTOForSpecificSchedule(enrolledCourse, schedule));
        } else {
            // Fallback to original conversion if no schedules
            return java.util.stream.Stream.of(convertToDTO(enrolledCourse));
        }
    }
    
    private EnrolledCourseResponseDTO convertToDTOForSpecificSchedule(EnrolledCourse enrolledCourse, com.stasis.stasis.model.Schedule schedule) {
        EnrolledCourseResponseDTO.EnrolledCourseResponseDTOBuilder builder = EnrolledCourseResponseDTO.builder()
            .enrolledCourseID(enrolledCourse.getEnrolledCourseID())
            .status(enrolledCourse.getStatus());
        
        // Use the specific schedule's course information
        var course = schedule.getCourse();
        Long courseId = course.getId();
        String courseCode = course.getCourseCode();
        String courseDescription = course.getCourseDescription();
        Integer credits = course.getCredits();
        
        // Add schedule information from the specific schedule
        String startTime = schedule.getStartTime() != null ? schedule.getStartTime().toString() : null;
        String endTime = schedule.getEndTime() != null ? schedule.getEndTime().toString() : null;
        String day = schedule.getDay();
        String room = schedule.getRoom();
        
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
            com.stasis.stasis.model.Grade grade = enrolledCourse.getGrade();
            builder.grade(grade.getGradeValue() != null ? grade.getGradeValue().toString() : null)
                   .gradeValue(grade.getGradeValue() != null ? grade.getGradeValue().doubleValue() : null)
                   .midtermGrade(grade.getMidtermGrade())
                   .finalGrade(grade.getFinalGrade())
                   .overallGrade(grade.getOverallGrade())
                   .remark(grade.getRemark());
        }
        
        return builder.build();
    }

}
