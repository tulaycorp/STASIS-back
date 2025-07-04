package com.stasis.stasis.service;

import com.stasis.stasis.model.EnrolledCourse;
import com.stasis.stasis.model.SemesterEnrollment;
import com.stasis.stasis.model.CourseSection;
import com.stasis.stasis.model.Student;
import com.stasis.stasis.model.Grade;
import com.stasis.stasis.repository.EnrolledCourseRepository;
import com.stasis.stasis.repository.CourseSectionRepository;
import com.stasis.stasis.repository.StudentRepository;
import com.stasis.stasis.repository.SemesterEnrollmentRepository;
import com.stasis.stasis.repository.GradeRepository;
import com.stasis.stasis.model.Schedule;
import com.stasis.stasis.repository.ScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing student course enrollments.
 * Enforces: A student may only be enrolled in one section/schedule per course.
 */
@Service
public class EnrolledCourseService {

    @Autowired
    private EnrolledCourseRepository enrolledCourseRepository;
    
    @Autowired
    private CourseSectionRepository courseSectionRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private SemesterEnrollmentRepository semesterEnrollmentRepository;
    
    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @PreAuthorize("hasRole('ADMIN')")
    public List<EnrolledCourse> getAllEnrolledCourses() {
        return enrolledCourseRepository.findAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'STUDENT')")
    public Optional<EnrolledCourse> getEnrolledCourseById(Long id) {
        Optional<EnrolledCourse> enrolledCourse = enrolledCourseRepository.findById(id);
        
        // Additional security check for students - they can only view their own enrollments
        if (enrolledCourse.isPresent() && hasRole("STUDENT")) {
            if (!isOwnerOfEnrollment(enrolledCourse.get())) {
                throw new SecurityException("Access denied: You can only view your own enrollments");
            }
        }
        
        return enrolledCourse;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public List<EnrolledCourse> getEnrolledCoursesBySemesterEnrollment(SemesterEnrollment semesterEnrollment) {
        return enrolledCourseRepository.findBySemesterEnrollment(semesterEnrollment);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    @Transactional
    public EnrolledCourse createEnrolledCourse(EnrolledCourse enrolledCourse) {
        // Ensure each enrolled course gets a unique grade instance if grade data is provided
        if (enrolledCourse.getGrade() != null) {
            Grade originalGrade = enrolledCourse.getGrade();
            Grade newGrade = Grade.builder()
                .gradeValue(originalGrade.getGradeValue())
                .gradeDate(originalGrade.getGradeDate())
                .midtermGrade(originalGrade.getMidtermGrade())
                .finalGrade(originalGrade.getFinalGrade())
                .overallGrade(originalGrade.getOverallGrade())
                .remark(originalGrade.getRemark())
                .build();
            Grade savedGrade = gradeRepository.save(newGrade);
            enrolledCourse.setGrade(savedGrade);
        }
        return enrolledCourseRepository.save(enrolledCourse);
    }

    public EnrolledCourse updateEnrolledCourse(Long id, EnrolledCourse updatedEnrolledCourse) {
        return enrolledCourseRepository.findById(id)
            .map(enrolledCourse -> {
                enrolledCourse.setSemesterEnrollment(updatedEnrolledCourse.getSemesterEnrollment());
                enrolledCourse.setSection(updatedEnrolledCourse.getSection());
                enrolledCourse.setStatus(updatedEnrolledCourse.getStatus());
                enrolledCourse.setGrade(updatedEnrolledCourse.getGrade());
                return enrolledCourseRepository.save(enrolledCourse);
            })
            .orElseThrow(() -> new RuntimeException("Enrolled Course not found with ID " + id));
    }

    public void deleteEnrolledCourse(Long id) {
        enrolledCourseRepository.deleteById(id);
    }

    public boolean updateEnrollmentStatus(Long enrolledCourseId, String newStatus) {
        Optional<EnrolledCourse> enrolledCourseOpt = enrolledCourseRepository.findById(enrolledCourseId);
        if (enrolledCourseOpt.isPresent()) {
            EnrolledCourse enrolledCourse = enrolledCourseOpt.get();
            enrolledCourse.setStatus(newStatus);
            enrolledCourseRepository.save(enrolledCourse);
            return true;
        }
        return false;
    }

    public List<EnrolledCourse> getEnrolledCoursesBySemesterEnrollmentId(Long semesterEnrollmentId) {
        // For now, return empty list - this will be properly implemented when SemesterEnrollment integration is complete
        return enrolledCourseRepository.findAll().stream()
            .filter(ec -> ec.getSemesterEnrollment() != null && 
                         ec.getSemesterEnrollment().getSemesterEnrollmentID().equals(semesterEnrollmentId))
            .toList();
    }

    public List<EnrolledCourse> getEnrolledCoursesByStudent(Long studentId) {
        return enrolledCourseRepository.findByStudentIdWithDetails(studentId);
    }

    public List<EnrolledCourse> getEnrolledCoursesBySection(Long sectionId) {
        return enrolledCourseRepository.findBySectionId(sectionId);
    }
    
    public EnrolledCourse createEnrollmentForStudent(Long studentId, Long courseSectionId, String status) {
        System.out.println("=== Creating enrollment for student ===");
        System.out.println("Student ID: " + studentId);
        System.out.println("Course Section ID: " + courseSectionId);
        System.out.println("Status: " + status);
        // Get the student
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));
        // Get the course section
        CourseSection courseSection = courseSectionRepository.findById(courseSectionId)
            .orElseThrow(() -> new RuntimeException("Course section not found with ID: " + courseSectionId));
        // --- ENFORCE: Only one enrollment per course per student ---
        // Get all course IDs for this section
        List<Long> sectionCourseIds = courseSection.getSchedules() != null ?
            courseSection.getSchedules().stream()
                .filter(sch -> sch.getCourse() != null)
                .map(sch -> sch.getCourse().getId())
                .distinct()
                .toList() : java.util.Collections.emptyList();
        // Get all existing enrollments for this student
        List<EnrolledCourse> existingEnrollments = enrolledCourseRepository.findByStudentIdWithDetails(studentId);
        // Check if student is already enrolled in any section with a schedule for the same course
        boolean alreadyEnrolledInCourse = existingEnrollments.stream()
            .anyMatch(enrollment -> enrollment.getSection() != null && enrollment.getSection().getSchedules() != null &&
                enrollment.getSection().getSchedules().stream()
                    .anyMatch(sch -> sch.getCourse() != null && sectionCourseIds.contains(sch.getCourse().getId()))
            );
        if (alreadyEnrolledInCourse) {
            System.out.println("Student is already enrolled in a section for one of these courses: " + sectionCourseIds);
            throw new RuntimeException("Student is already enrolled in this course (via another section)");
        }
        // Check if student is already enrolled in this specific course section
        boolean alreadyEnrolled = existingEnrollments.stream()
            .anyMatch(enrollment -> enrollment.getSection().getSectionID().equals(courseSectionId));
        if (alreadyEnrolled) {
            System.out.println("Student is already enrolled in course section: " + courseSectionId);
            throw new RuntimeException("Student is already enrolled in this course section");
        }
        // Find or create a semester enrollment for this student
        SemesterEnrollment semesterEnrollment = findOrCreateCurrentSemesterEnrollment(student);
        System.out.println("Using semester enrollment ID: " + semesterEnrollment.getSemesterEnrollmentID());
        EnrolledCourse enrolledCourse = EnrolledCourse.builder()
            .semesterEnrollment(semesterEnrollment)
            .section(courseSection)
            .status(status != null ? status : "ACTIVE") // Default to ACTIVE if no status provided
            .build();
        EnrolledCourse savedEnrollment = enrolledCourseRepository.save(enrolledCourse);
        System.out.println("Created enrollment with ID: " + savedEnrollment.getEnrolledCourseID());
        updateSemesterEnrollmentCredits(semesterEnrollment);
        List<EnrolledCourse> allStudentEnrollments = enrolledCourseRepository.findByStudentIdWithDetails(studentId);
        System.out.println("Student now enrolled in " + allStudentEnrollments.size() + " courses total");
        return savedEnrollment;
    }
    
    /**
     * Update the total credits for a semester enrollment based on enrolled courses
     */
    private void updateSemesterEnrollmentCredits(SemesterEnrollment semesterEnrollment) {
        List<EnrolledCourse> enrolledCourses = enrolledCourseRepository.findBySemesterEnrollment(semesterEnrollment);
        int totalCredits = enrolledCourses.size() * 3; // Assuming 3 credits per course
        semesterEnrollment.setTotalCredits(totalCredits);
        semesterEnrollmentRepository.save(semesterEnrollment);
        System.out.println("Updated semester enrollment credits to: " + totalCredits);
    }
    
    // Security helper methods
    private boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
            .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }
    
    private boolean isOwnerOfEnrollment(EnrolledCourse enrolledCourse) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return false;
        // This would need proper implementation based on your user-student relationship
        return true; // Simplified for now - implement proper check
    }
    
    private SemesterEnrollment findOrCreateCurrentSemesterEnrollment(Student student) {
        // Get current academic year and semester
        String currentAcademicYear = "2024-2025"; // You might want to calculate this dynamically
        String currentSemester = "1"; // You might want to determine this based on current date
        
        // First, try to find an existing active semester enrollment for this student in the current semester
        List<SemesterEnrollment> existingEnrollments = semesterEnrollmentRepository.findAll()
            .stream()
            .filter(se -> se.getStudent().getId().equals(student.getId()) && 
                         "ACTIVE".equals(se.getStatus()) &&
                         currentAcademicYear.equals(se.getAcademicYear()) &&
                         currentSemester.equals(se.getSemester()))
            .collect(Collectors.toList());
        
        if (!existingEnrollments.isEmpty()) {
            // Return the existing enrollment for this semester
            SemesterEnrollment existing = existingEnrollments.get(0);
            System.out.println("Found existing semester enrollment: " + existing.getSemesterEnrollmentID() + 
                             " for academic year: " + existing.getAcademicYear() + 
                             ", semester: " + existing.getSemester());
            return existing;
        }
        
        // If no active enrollment exists for this semester, create a new one
        SemesterEnrollment newSemesterEnrollment = SemesterEnrollment.builder()
            .student(student)
            .semester(currentSemester)
            .academicYear(currentAcademicYear)
            .status("ACTIVE")
            .dateEnrolled(LocalDate.now())
            .totalCredits(0)
            .build();
        
        SemesterEnrollment saved = semesterEnrollmentRepository.save(newSemesterEnrollment);
        System.out.println("Created new semester enrollment: " + saved.getSemesterEnrollmentID() + 
                         " for academic year: " + saved.getAcademicYear() + 
                         ", semester: " + saved.getSemester());
        return saved;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    @Transactional
    public EnrolledCourse updateGrades(Long enrolledCourseId, Map<String, Object> gradeData) {
        System.out.println("=== EnrolledCourseService.updateGrades START ===");
        System.out.println("EnrolledCourse ID: " + enrolledCourseId);
        System.out.println("Grade data: " + gradeData);
        
        try {
            EnrolledCourse enrolledCourse = enrolledCourseRepository.findById(enrolledCourseId)
                .orElseThrow(() -> new RuntimeException("Enrolled Course not found with ID " + enrolledCourseId));

            System.out.println("Found enrolled course: " + enrolledCourse.getEnrolledCourseID());

            // Create or update the grade entity with all grade components
            Grade grade = enrolledCourse.getGrade();
            if (grade == null) {
                System.out.println("Creating new grade...");
                // Create a unique grade for this enrollment
                grade = createUniqueGrade(enrolledCourse, gradeData);
                System.out.println("Created new grade with ID: " + grade.getGradeID());
            } else {
                System.out.println("Updating existing grade with ID: " + grade.getGradeID());
                // Update existing grade while ensuring it remains unique to this enrollment
                if (gradeData.containsKey("midtermGrade") && gradeData.get("midtermGrade") != null) {
                    Double midterm = parseGradeValue(gradeData.get("midtermGrade"));
                    grade.setMidtermGrade(midterm);
                    System.out.println("Updated midterm grade: " + midterm);
                }
                if (gradeData.containsKey("finalGrade") && gradeData.get("finalGrade") != null) {
                    Double finalGrade = parseGradeValue(gradeData.get("finalGrade"));
                    grade.setFinalGrade(finalGrade);
                    System.out.println("Updated final grade: " + finalGrade);
                }
                if (gradeData.containsKey("overallGrade") && gradeData.get("overallGrade") != null) {
                    Double overallGrade = parseGradeValue(gradeData.get("overallGrade"));
                    grade.setGradeValue(BigDecimal.valueOf(overallGrade));
                    grade.setOverallGrade(overallGrade);
                    System.out.println("Updated overall grade: " + overallGrade);
                }
                if (gradeData.containsKey("remark") && gradeData.get("remark") != null) {
                    String remark = gradeData.get("remark").toString();
                    grade.setRemark(remark);
                    System.out.println("Updated remark: " + remark);
                }
                grade.setGradeDate(LocalDate.now());
                grade = gradeRepository.save(grade);
                System.out.println("Saved grade successfully");
            }

            // Update the enrolled course with the grade
            enrolledCourse.setGrade(grade);
            EnrolledCourse savedEnrollment = enrolledCourseRepository.save(enrolledCourse);
            System.out.println("Saved enrolled course successfully");
            
            System.out.println("=== EnrolledCourseService.updateGrades END SUCCESS ===");
            return savedEnrollment;
            
        } catch (Exception e) {
            System.err.println("Error in updateGrades: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update grades: " + e.getMessage(), e);
        }
    }
    
    private Double parseGradeValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.valueOf(value.toString());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid grade value: " + value);
        }
    }

    // Faculty grade management methods
    public List<EnrolledCourse> getEnrolledCoursesByFaculty(Long facultyId) {
        // First, get all course sections assigned to this faculty
        List<CourseSection> facultySections = courseSectionRepository.findByFaculty_FacultyID(facultyId);
        
        if (facultySections.isEmpty()) {
            return List.of(); // Return empty list if no sections assigned
        }
        
        // Extract section IDs
        List<Long> sectionIds = facultySections.stream()
            .map(CourseSection::getSectionID)
            .toList();
        
        // Get all enrollments for these sections with full details
        return enrolledCourseRepository.findBySectionIds(sectionIds);
    }

    public List<EnrolledCourse> getEnrolledCoursesByFacultyAndProgram(Long facultyId, Long programId) {
        return enrolledCourseRepository.findByFacultyAndProgram(facultyId, programId);
    }

    // New method to get all students enrolled in a specific course (across all sections)
    public List<EnrolledCourse> getEnrolledCoursesByCourse(Long courseId) {
        return enrolledCourseRepository.findByCourseId(courseId);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    @Transactional
    public EnrolledCourse updateMidtermGrade(Long enrolledCourseId, Double midtermGrade) {
        EnrolledCourse enrolledCourse = enrolledCourseRepository.findById(enrolledCourseId)
            .orElseThrow(() -> new RuntimeException("Enrolled Course not found with ID " + enrolledCourseId));

        Grade grade = enrolledCourse.getGrade();
        if (grade == null) {
            // Create new unique grade for this enrollment
            grade = Grade.builder()
                .midtermGrade(midtermGrade)
                .gradeDate(LocalDate.now())
                .build();
            grade = gradeRepository.save(grade);
        } else {
            // Update existing grade that belongs to this enrollment
            grade.setMidtermGrade(midtermGrade);
            grade.setGradeDate(LocalDate.now());
            gradeRepository.save(grade);
        }

        enrolledCourse.setGrade(grade);
        return enrolledCourseRepository.save(enrolledCourse);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    @Transactional
    public EnrolledCourse updateFinalGrade(Long enrolledCourseId, Double finalGrade) {
        EnrolledCourse enrolledCourse = enrolledCourseRepository.findById(enrolledCourseId)
            .orElseThrow(() -> new RuntimeException("Enrolled Course not found with ID " + enrolledCourseId));

        Grade grade = enrolledCourse.getGrade();
        if (grade == null) {
            // Create new unique grade for this enrollment
            grade = Grade.builder()
                .finalGrade(finalGrade)
                .gradeDate(LocalDate.now())
                .build();
            grade = gradeRepository.save(grade);
        } else {
            // Update existing grade that belongs to this enrollment
            grade.setFinalGrade(finalGrade);
            grade.setGradeDate(LocalDate.now());
            gradeRepository.save(grade);
        }

        enrolledCourse.setGrade(grade);
        return enrolledCourseRepository.save(enrolledCourse);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    @Transactional
    public EnrolledCourse updateOverallGrade(Long enrolledCourseId, Double overallGrade) {
        EnrolledCourse enrolledCourse = enrolledCourseRepository.findById(enrolledCourseId)
            .orElseThrow(() -> new RuntimeException("Enrolled Course not found with ID " + enrolledCourseId));

        Grade grade = enrolledCourse.getGrade();
        if (grade == null) {
            // Create new unique grade for this enrollment
            grade = Grade.builder()
                .gradeValue(BigDecimal.valueOf(overallGrade))
                .overallGrade(overallGrade)
                .gradeDate(LocalDate.now())
                .build();
            grade = gradeRepository.save(grade);
        } else {
            // Update existing grade that belongs to this enrollment
            grade.setGradeValue(BigDecimal.valueOf(overallGrade));
            grade.setOverallGrade(overallGrade);
            grade.setGradeDate(LocalDate.now());
            gradeRepository.save(grade);
        }

        enrolledCourse.setGrade(grade);
        return enrolledCourseRepository.save(enrolledCourse);
    }
    
    /**
     * Create a new grade that is unique to this enrolled course
     */
    private Grade createUniqueGrade(EnrolledCourse enrolledCourse, Map<String, Object> gradeData) {
        // Extract grade values from the request
        Double midtermGrade = null;
        Double finalGrade = null;
        Double overallGrade = null;
        String remark = null;

        if (gradeData.containsKey("midtermGrade") && gradeData.get("midtermGrade") != null) {
            midtermGrade = Double.valueOf(gradeData.get("midtermGrade").toString());
        }
        if (gradeData.containsKey("finalGrade") && gradeData.get("finalGrade") != null) {
            finalGrade = Double.valueOf(gradeData.get("finalGrade").toString());
        }
        if (gradeData.containsKey("overallGrade") && gradeData.get("overallGrade") != null) {
            overallGrade = Double.valueOf(gradeData.get("overallGrade").toString());
        }
        if (gradeData.containsKey("remark") && gradeData.get("remark") != null) {
            remark = gradeData.get("remark").toString();
        }

        // Create a new grade instance that belongs only to this enrollment
        Grade grade = Grade.builder()
            .gradeValue(overallGrade != null ? BigDecimal.valueOf(overallGrade) : null)
            .gradeDate(LocalDate.now())
            .midtermGrade(midtermGrade)
            .finalGrade(finalGrade)
            .overallGrade(overallGrade)
            .remark(remark)
            .build();
            
        return gradeRepository.save(grade);
    }
    
    /**
     * Get enrolled courses by student ID with proper data isolation
     */
    public List<EnrolledCourse> getEnrolledCoursesByStudentWithIsolation(Long studentId) {
        // Use the specific query that ensures we get only this student's data
        return enrolledCourseRepository.findByStudentIdWithDetails(studentId);
    }

    /**
     * Validate that a grade is not being shared between multiple enrollments
     */
    @Transactional
    public void validateGradeIsolation() {
        List<EnrolledCourse> allEnrollments = enrolledCourseRepository.findAll();
        Map<Long, List<EnrolledCourse>> gradeIdToEnrollments = allEnrollments.stream()
            .filter(ec -> ec.getGrade() != null)
            .collect(Collectors.groupingBy(ec -> ec.getGrade().getGradeID()));
        
        for (Map.Entry<Long, List<EnrolledCourse>> entry : gradeIdToEnrollments.entrySet()) {
            if (entry.getValue().size() > 1) {
                // Grade is shared between multiple enrollments - fix this
                List<EnrolledCourse> enrollments = entry.getValue();
                Grade originalGrade = enrollments.get(0).getGrade();
                
                // Keep the original grade for the first enrollment
                // Create new grades for the rest
                for (int i = 1; i < enrollments.size(); i++) {
                    EnrolledCourse enrollment = enrollments.get(i);
                    Grade newGrade = Grade.builder()
                        .gradeValue(originalGrade.getGradeValue())
                        .gradeDate(originalGrade.getGradeDate())
                        .midtermGrade(originalGrade.getMidtermGrade())
                        .finalGrade(originalGrade.getFinalGrade())
                        .overallGrade(originalGrade.getOverallGrade())
                        .remark(originalGrade.getRemark())
                        .build();
                    
                    Grade savedGrade = gradeRepository.save(newGrade);
                    enrollment.setGrade(savedGrade);
                    enrolledCourseRepository.save(enrollment);
                    
                    System.out.println("Fixed grade sharing: Created new grade " + savedGrade.getGradeID() + 
                                     " for enrollment " + enrollment.getEnrolledCourseID());
                }
            }
        }
    }
    
    /**
     * Get enrolled courses for a specific student with additional security checks
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY') or (hasRole('STUDENT') and @securityService.isCurrentUser(#studentId))")
    public List<EnrolledCourse> getEnrolledCoursesByStudentSecure(Long studentId) {
        List<EnrolledCourse> enrollments = enrolledCourseRepository.findByStudentIdWithDetails(studentId);
        
        // Validate grade isolation for this student's enrollments
        Map<Long, Long> gradeToEnrollmentCount = enrollments.stream()
            .filter(ec -> ec.getGrade() != null)
            .collect(Collectors.groupingBy(
                ec -> ec.getGrade().getGradeID(),
                Collectors.counting()
            ));
        
        boolean hasSharedGrades = gradeToEnrollmentCount.values().stream().anyMatch(count -> count > 1);
        if (hasSharedGrades) {
            System.out.println("Warning: Student " + studentId + " has shared grades. Running validation...");
            validateGradeIsolation();
            // Refetch after validation
            enrollments = enrolledCourseRepository.findByStudentIdWithDetails(studentId);
        }
        
        return enrollments;
    }

    /**
     * Enroll a student in multiple course sections at once
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    @Transactional
    public List<EnrolledCourse> enrollStudentInMultipleCourses(Long studentId, List<Long> courseSectionIds, String status) {
        System.out.println("=== Enrolling student in multiple courses ===");
        System.out.println("Student ID: " + studentId);
        System.out.println("Course Section IDs: " + courseSectionIds);
        
        // Get the student
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));
        
        // Find or create a semester enrollment for this student
        SemesterEnrollment semesterEnrollment = findOrCreateCurrentSemesterEnrollment(student);
        
        // Get existing enrollments to check for duplicates
        List<EnrolledCourse> existingEnrollments = enrolledCourseRepository.findByStudentIdWithDetails(studentId);
        List<Long> existingSectionIds = existingEnrollments.stream()
            .map(enrollment -> enrollment.getSection().getSectionID())
            .collect(Collectors.toList());
        
        List<EnrolledCourse> newEnrollments = new ArrayList<>();
        
        for (Long courseSectionId : courseSectionIds) {
            // Skip if already enrolled
            if (existingSectionIds.contains(courseSectionId)) {
                System.out.println("Student already enrolled in section " + courseSectionId + ", skipping...");
                continue;
            }
            
            // Get the course section
            CourseSection courseSection = courseSectionRepository.findById(courseSectionId)
                .orElseThrow(() -> new RuntimeException("Course section not found with ID: " + courseSectionId));
            
            // Create the enrolled course
            EnrolledCourse enrolledCourse = EnrolledCourse.builder()
                .semesterEnrollment(semesterEnrollment)
                .section(courseSection)
                .status(status)
                .build();
            
            EnrolledCourse savedEnrollment = enrolledCourseRepository.save(enrolledCourse);
            newEnrollments.add(savedEnrollment);
            System.out.println("Created enrollment with ID: " + savedEnrollment.getEnrolledCourseID());
        }
        
        // Update the total credits in the semester enrollment
        if (!newEnrollments.isEmpty()) {
            updateSemesterEnrollmentCredits(semesterEnrollment);
        }
        
        System.out.println("Successfully enrolled student in " + newEnrollments.size() + " new courses");
        return newEnrollments;
    }

    /**
     * Student-specific enrollment method that delegates to createEnrollmentForStudent
     */
    // @PreAuthorize("hasRole('STUDENT')") // Temporarily disabled for debugging
    @Transactional
    public EnrolledCourse studentEnrollInCourse(Long studentId, Long courseSectionId, String status) {
        return createEnrollmentForStudent(studentId, courseSectionId, status);
    }

    /**
     * Student-specific enrollment method using schedule ID for validation
     */
    // @PreAuthorize("hasRole('STUDENT')") // Temporarily disabled for debugging
    @Transactional
    public EnrolledCourse studentEnrollInSchedule(Long studentId, Long scheduleId, String status) {
        // Find the section that contains this schedule
        Schedule schedule = scheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Schedule not found with ID: " + scheduleId));
        
        // Find the section containing this schedule
        List<CourseSection> allSections = courseSectionRepository.findAll();
        CourseSection targetSection = allSections.stream()
            .filter(section -> section.getSchedules() != null && 
                section.getSchedules().stream().anyMatch(sch -> sch.getScheduleID().equals(scheduleId)))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("No section found containing schedule: " + scheduleId));
        
        return createEnrollmentForStudentWithSchedule(studentId, targetSection.getSectionID(), scheduleId, status);
    }

    /**
     * Returns a list of available schedules for a student, ensuring no multiple schedules of the same course are available.
     * Each course appears only once (the first available schedule for each course).
     * Use this for UI filtering to prevent duplicate course enrollments.
     */
    public List<Schedule> getAvailableSchedulesForStudent(Long studentId) {
        // Get all enrolled schedules for the student (by course)
        List<EnrolledCourse> enrolledCourses = enrolledCourseRepository.findByStudentIdWithDetails(studentId);
        List<Long> enrolledCourseIds = enrolledCourses.stream()
            .flatMap(ec -> ec.getSection().getSchedules().stream())
            .filter(sch -> sch.getCourse() != null)
            .map(sch -> sch.getCourse().getId())
            .distinct()
            .toList();
        // Get all schedules from all sections
        List<Schedule> allSchedules = scheduleRepository.findAll();
        // Filter out schedules for courses the student is already enrolled in
        List<Schedule> availableSchedules = allSchedules.stream()
            .filter(schedule -> schedule.getCourse() != null && !enrolledCourseIds.contains(schedule.getCourse().getId()))
            .toList();
        // Ensure each course appears only once (first available schedule per course)
        Map<Long, Schedule> courseToSchedule = new java.util.LinkedHashMap<>();
        for (Schedule schedule : availableSchedules) {
            if (!courseToSchedule.containsKey(schedule.getCourse().getId())) {
                courseToSchedule.put(schedule.getCourse().getId(), schedule);
            }
        }
        return new ArrayList<>(courseToSchedule.values());
    }
    
    /**
     * Returns all available schedules for enrollment (no filtering by course).
     * Use this if you want to show all schedules, but filter/disable in the frontend.
     */
    public List<Schedule> getAllAvailableSchedules() {
        return scheduleRepository.findAll();
    }
    
    /**
     * Create enrollment for student with specific schedule validation
     */
    public EnrolledCourse createEnrollmentForStudentWithSchedule(Long studentId, Long courseSectionId, Long scheduleId, String status) {
        System.out.println("=== Creating enrollment for student with schedule validation ===");
        System.out.println("Student ID: " + studentId);
        System.out.println("Course Section ID: " + courseSectionId);
        System.out.println("Schedule ID: " + scheduleId);
        System.out.println("Status: " + status);
        
        // Get the student
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));
        
        // Get the course section
        CourseSection courseSection = courseSectionRepository.findById(courseSectionId)
            .orElseThrow(() -> new RuntimeException("Course section not found with ID: " + courseSectionId));
        
        // Get the specific schedule to validate the intended course
        Schedule targetSchedule = scheduleRepository.findById(scheduleId)
            .orElseThrow(() -> new RuntimeException("Schedule not found with ID: " + scheduleId));
        
        if (targetSchedule.getCourse() == null) {
            throw new RuntimeException("Schedule " + scheduleId + " does not have a course assigned");
        }
        
        Long targetCourseId = targetSchedule.getCourse().getId();
        System.out.println("Target course ID from schedule: " + targetCourseId);
        
        // Validate that the schedule belongs to the section
        boolean scheduleInSection = courseSection.getSchedules() != null &&
            courseSection.getSchedules().stream()
                .anyMatch(sch -> sch.getScheduleID().equals(scheduleId));
        
        if (!scheduleInSection) {
            throw new RuntimeException("Schedule " + scheduleId + " does not belong to section " + courseSectionId);
        }
        
        // --- ENFORCE: Only one enrollment per course per student ---
        // Get all existing enrollments for this student
        List<EnrolledCourse> existingEnrollments = enrolledCourseRepository.findByStudentIdWithDetails(studentId);
        System.out.println("Found " + existingEnrollments.size() + " existing enrollments for student " + studentId);
        
        // Debug: Print all existing enrollments with null-safe checks
        for (EnrolledCourse ec : existingEnrollments) {
            System.out.println("Existing enrollment: ID=" + ec.getEnrolledCourseID() + 
                              ", Section=" + (ec.getSection() != null ? ec.getSection().getSectionID() : "null") +
                              ", Status=" + ec.getStatus());
            if (ec.getSection() != null && ec.getSection().getSchedules() != null) {
                System.out.println("  Section has " + ec.getSection().getSchedules().size() + " schedules");
                for (Schedule sch : ec.getSection().getSchedules()) {
                    if (sch != null) {
                        System.out.println("  Schedule: ID=" + sch.getScheduleID() + 
                                          ", Course=" + (sch.getCourse() != null ? sch.getCourse().getId() : "null"));
                    } else {
                        System.out.println("  Schedule is null!");
                    }
                }
            } else {
                System.out.println("  Section is null or has no schedules");
            }
        }
        
        // Check if student is already enrolled in this specific course (any section) with null-safe checks
        boolean alreadyEnrolledInCourse = false;
        try {
            alreadyEnrolledInCourse = existingEnrollments.stream()
                .filter(enrollment -> enrollment != null && enrollment.getSection() != null && enrollment.getSection().getSchedules() != null)
                .anyMatch(enrollment -> enrollment.getSection().getSchedules().stream()
                    .filter(sch -> sch != null && sch.getCourse() != null)
                    .anyMatch(sch -> sch.getCourse().getId().equals(targetCourseId))
                );
        } catch (Exception e) {
            System.err.println("Error checking existing enrollments: " + e.getMessage());
            e.printStackTrace();
            // If there's an error, assume not enrolled and continue
            alreadyEnrolledInCourse = false;
        }
        
        System.out.println("Already enrolled in course " + targetCourseId + "? " + alreadyEnrolledInCourse);
        
        if (alreadyEnrolledInCourse) {
            System.out.println("Student is already enrolled in course: " + targetCourseId);
            throw new RuntimeException("Student is already enrolled in this course (course ID: " + targetCourseId + ")");
        }
        
        // Check if student is already enrolled in this specific course section
        boolean alreadyEnrolled = existingEnrollments.stream()
            .anyMatch(enrollment -> enrollment.getSection().getSectionID().equals(courseSectionId));
        
        System.out.println("Already enrolled in section " + courseSectionId + "? " + alreadyEnrolled);
        
        if (alreadyEnrolled) {
            System.out.println("Student is already enrolled in course section: " + courseSectionId);
            throw new RuntimeException("Student is already enrolled in this course section");
        }
        // Find or create a semester enrollment for this student
        SemesterEnrollment semesterEnrollment = findOrCreateCurrentSemesterEnrollment(student);
        System.out.println("Using semester enrollment ID: " + semesterEnrollment.getSemesterEnrollmentID());
        
        EnrolledCourse enrolledCourse = EnrolledCourse.builder()
            .semesterEnrollment(semesterEnrollment)
            .section(courseSection)
            .status(status != null ? status : "ACTIVE") // Default to ACTIVE if no status provided
            .build();
        
        EnrolledCourse savedEnrollment = enrolledCourseRepository.save(enrolledCourse);
        System.out.println("Created enrollment with ID: " + savedEnrollment.getEnrolledCourseID() + " for course: " + targetCourseId);
        
        updateSemesterEnrollmentCredits(semesterEnrollment);
        
        List<EnrolledCourse> allStudentEnrollments = enrolledCourseRepository.findByStudentIdWithDetails(studentId);
        System.out.println("Student now enrolled in " + allStudentEnrollments.size() + " courses total");
        
        return savedEnrollment;
    }
    
    /**
     * Debug method - simplified enrollment without complex validation
     */
    @Transactional
    public EnrolledCourse createSimpleEnrollment(Long studentId, Long courseSectionId, String status) {
        System.out.println("=== Creating SIMPLE enrollment for debugging ===");
        System.out.println("Student ID: " + studentId);
        System.out.println("Course Section ID: " + courseSectionId);
        System.out.println("Status: " + status);
        
        // Get the student
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));
        System.out.println("Found student: " + student.getFirstName() + " " + student.getLastName());
        
        // Get the course section
        CourseSection courseSection = courseSectionRepository.findById(courseSectionId)
            .orElseThrow(() -> new RuntimeException("Course section not found with ID: " + courseSectionId));
        System.out.println("Found course section: " + courseSection.getSectionName());
        
        // Find or create a semester enrollment for this student
        SemesterEnrollment semesterEnrollment = findOrCreateCurrentSemesterEnrollment(student);
        System.out.println("Using semester enrollment ID: " + semesterEnrollment.getSemesterEnrollmentID());
        
        EnrolledCourse enrolledCourse = EnrolledCourse.builder()
            .semesterEnrollment(semesterEnrollment)
            .section(courseSection)
            .status(status != null ? status : "ACTIVE")
            .build();
        
        EnrolledCourse savedEnrollment = enrolledCourseRepository.save(enrolledCourse);
        System.out.println("Created simple enrollment with ID: " + savedEnrollment.getEnrolledCourseID());
        
        return savedEnrollment;
    }
}
