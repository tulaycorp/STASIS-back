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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

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

    public boolean enrollStudentInCourseSection(SemesterEnrollment semesterEnrollment, CourseSection section, String status) {
        try {
            EnrolledCourse enrolledCourse = EnrolledCourse.builder()
                .semesterEnrollment(semesterEnrollment)
                .section(section)
                .status(status)
                .build();
            enrolledCourseRepository.save(enrolledCourse);
            return true;
        } catch (Exception e) {
            return false;
        }
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
        // Get the student
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new RuntimeException("Student not found with ID: " + studentId));
        
        // Get the course section
        CourseSection courseSection = courseSectionRepository.findById(courseSectionId)
            .orElseThrow(() -> new RuntimeException("Course section not found with ID: " + courseSectionId));
        
        // Find or create a semester enrollment for this student
        // For now, we'll create a simple semester enrollment or find an existing one
        SemesterEnrollment semesterEnrollment = findOrCreateCurrentSemesterEnrollment(student);
        
        // Create the enrolled course
        EnrolledCourse enrolledCourse = EnrolledCourse.builder()
            .semesterEnrollment(semesterEnrollment)
            .section(courseSection)
            .status(status)
            .build();
        
        return enrolledCourseRepository.save(enrolledCourse);
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
        
        String currentUsername = authentication.getName();
        
        // Get the student associated with this enrollment
        Student enrollmentStudent = enrolledCourse.getSemesterEnrollment().getStudent();
        
        // Find the user by username and check if it matches the enrollment student
        // This would need proper implementation based on your user-student relationship
        return true; // Simplified for now - implement proper check
    }
    
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }

    private SemesterEnrollment findOrCreateCurrentSemesterEnrollment(Student student) {
        // First, try to find an existing active semester enrollment for this student
        List<SemesterEnrollment> existingEnrollments = semesterEnrollmentRepository.findAll()
            .stream()
            .filter(se -> se.getStudent().getId().equals(student.getId()) && "ACTIVE".equals(se.getStatus()))
            .collect(Collectors.toList());
        
        if (!existingEnrollments.isEmpty()) {
            // Return the first active enrollment
            return existingEnrollments.get(0);
        }
        
        // If no active enrollment exists, create a new one
        SemesterEnrollment newSemesterEnrollment = SemesterEnrollment.builder()
            .student(student)
            .semester("1") // Default to first semester
            .academicYear("2024-2025") // Default academic year
            .status("ACTIVE")
            .dateEnrolled(LocalDate.now())
            .totalCredits(0)
            .build();
        
        return semesterEnrollmentRepository.save(newSemesterEnrollment);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    @Transactional
    public EnrolledCourse updateGrades(Long enrolledCourseId, Map<String, Object> gradeData) {
        EnrolledCourse enrolledCourse = enrolledCourseRepository.findById(enrolledCourseId)
            .orElseThrow(() -> new RuntimeException("Enrolled Course not found with ID " + enrolledCourseId));

        // Create or update the grade entity with all grade components
        Grade grade = enrolledCourse.getGrade();
        if (grade == null) {
            // Create a unique grade for this enrollment
            grade = createUniqueGrade(enrolledCourse, gradeData);
        } else {
            // Update existing grade while ensuring it remains unique to this enrollment
            if (gradeData.containsKey("midtermGrade") && gradeData.get("midtermGrade") != null) {
                grade.setMidtermGrade(Double.valueOf(gradeData.get("midtermGrade").toString()));
            }
            if (gradeData.containsKey("finalGrade") && gradeData.get("finalGrade") != null) {
                grade.setFinalGrade(Double.valueOf(gradeData.get("finalGrade").toString()));
            }
            if (gradeData.containsKey("overallGrade") && gradeData.get("overallGrade") != null) {
                Double overallGrade = Double.valueOf(gradeData.get("overallGrade").toString());
                grade.setGradeValue(BigDecimal.valueOf(overallGrade));
                grade.setOverallGrade(overallGrade);
            }
            if (gradeData.containsKey("remark") && gradeData.get("remark") != null) {
                grade.setRemark(gradeData.get("remark").toString());
            }
            grade.setGradeDate(LocalDate.now());
            gradeRepository.save(grade);
        }

        // Update the enrolled course with the grade
        enrolledCourse.setGrade(grade);
        return enrolledCourseRepository.save(enrolledCourse);
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
}
