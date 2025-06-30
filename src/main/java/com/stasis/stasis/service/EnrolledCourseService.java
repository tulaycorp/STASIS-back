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
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    public List<EnrolledCourse> getAllEnrolledCourses() {
        return enrolledCourseRepository.findAll();
    }

    public Optional<EnrolledCourse> getEnrolledCourseById(Long id) {
        return enrolledCourseRepository.findById(id);
    }

    public List<EnrolledCourse> getEnrolledCoursesBySemesterEnrollment(SemesterEnrollment semesterEnrollment) {
        return enrolledCourseRepository.findBySemesterEnrollment(semesterEnrollment);
    }

    public EnrolledCourse createEnrolledCourse(EnrolledCourse enrolledCourse) {
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
    
    private SemesterEnrollment findOrCreateCurrentSemesterEnrollment(Student student) {
        // For now, create a simple semester enrollment
        // In a real application, you would have proper semester enrollment management
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

    public EnrolledCourse updateGrades(Long enrolledCourseId, Map<String, Object> gradeData) {
        EnrolledCourse enrolledCourse = enrolledCourseRepository.findById(enrolledCourseId)
            .orElseThrow(() -> new RuntimeException("Enrolled Course not found with ID " + enrolledCourseId));

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

        // Create or update the grade entity with all grade components
        Grade grade = enrolledCourse.getGrade();
        if (grade == null) {
            grade = Grade.builder()
                .enrolledCourse(enrolledCourse)
                .gradeValue(overallGrade != null ? BigDecimal.valueOf(overallGrade) : null)
                .gradeDate(LocalDate.now())
                .midtermGrade(midtermGrade)
                .finalGrade(finalGrade)
                .overallGrade(overallGrade)
                .remark(remark)
                .build();
        } else {
            if (overallGrade != null) {
                grade.setGradeValue(BigDecimal.valueOf(overallGrade));
            }
            if (midtermGrade != null) {
                grade.setMidtermGrade(midtermGrade);
            }
            if (finalGrade != null) {
                grade.setFinalGrade(finalGrade);
            }
            if (overallGrade != null) {
                grade.setOverallGrade(overallGrade);
            }
            if (remark != null) {
                grade.setRemark(remark);
            }
            grade.setGradeDate(LocalDate.now());
        }

        // Save the grade first
        if (grade.getGradeID() == null) {
            grade = gradeRepository.save(grade);
        } else {
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

    public EnrolledCourse updateMidtermGrade(Long enrolledCourseId, Double midtermGrade) {
        EnrolledCourse enrolledCourse = enrolledCourseRepository.findById(enrolledCourseId)
            .orElseThrow(() -> new RuntimeException("Enrolled Course not found with ID " + enrolledCourseId));

        Grade grade = enrolledCourse.getGrade();
        if (grade == null) {
            grade = Grade.builder()
                .enrolledCourse(enrolledCourse)
                .midtermGrade(midtermGrade)
                .gradeDate(LocalDate.now())
                .build();
            grade = gradeRepository.save(grade);
        } else {
            grade.setMidtermGrade(midtermGrade);
            grade.setGradeDate(LocalDate.now());
            gradeRepository.save(grade);
        }

        enrolledCourse.setGrade(grade);
        return enrolledCourseRepository.save(enrolledCourse);
    }

    public EnrolledCourse updateFinalGrade(Long enrolledCourseId, Double finalGrade) {
        EnrolledCourse enrolledCourse = enrolledCourseRepository.findById(enrolledCourseId)
            .orElseThrow(() -> new RuntimeException("Enrolled Course not found with ID " + enrolledCourseId));

        Grade grade = enrolledCourse.getGrade();
        if (grade == null) {
            grade = Grade.builder()
                .enrolledCourse(enrolledCourse)
                .finalGrade(finalGrade)
                .gradeDate(LocalDate.now())
                .build();
            grade = gradeRepository.save(grade);
        } else {
            grade.setFinalGrade(finalGrade);
            grade.setGradeDate(LocalDate.now());
            gradeRepository.save(grade);
        }

        enrolledCourse.setGrade(grade);
        return enrolledCourseRepository.save(enrolledCourse);
    }

    public EnrolledCourse updateOverallGrade(Long enrolledCourseId, Double overallGrade) {
        EnrolledCourse enrolledCourse = enrolledCourseRepository.findById(enrolledCourseId)
            .orElseThrow(() -> new RuntimeException("Enrolled Course not found with ID " + enrolledCourseId));

        Grade grade = enrolledCourse.getGrade();
        if (grade == null) {
            grade = Grade.builder()
                .enrolledCourse(enrolledCourse)
                .gradeValue(BigDecimal.valueOf(overallGrade))
                .overallGrade(overallGrade)
                .gradeDate(LocalDate.now())
                .build();
            grade = gradeRepository.save(grade);
        } else {
            grade.setGradeValue(BigDecimal.valueOf(overallGrade));
            grade.setOverallGrade(overallGrade);
            grade.setGradeDate(LocalDate.now());
            gradeRepository.save(grade);
        }

        enrolledCourse.setGrade(grade);
        return enrolledCourseRepository.save(enrolledCourse);
    }
}
