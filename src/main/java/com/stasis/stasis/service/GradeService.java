package com.stasis.stasis.service;

import com.stasis.stasis.model.Grade;
import com.stasis.stasis.model.EnrolledCourse;
import com.stasis.stasis.model.SemesterEnrollment;
import com.stasis.stasis.model.Student;
import com.stasis.stasis.repository.GradeRepository;
import com.stasis.stasis.repository.EnrolledCourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
public class GradeService {

    @Autowired
    private GradeRepository gradeRepository;

    @Autowired
    private EnrolledCourseRepository enrolledCourseRepository;

    public List<Grade> getAllGrades() {
        return gradeRepository.findAll();
    }

    public Optional<Grade> getGradeById(Long id) {
        return gradeRepository.findById(id);
    }

    public Grade createGrade(Grade grade) {
        return gradeRepository.save(grade);
    }

    public Grade updateGrade(Long id, Grade updatedGrade) {
        return gradeRepository.findById(id)
            .map(grade -> {
                grade.setEnrolledCourse(updatedGrade.getEnrolledCourse()); // Fixed: changed from setEnrollment to setEnrolledCourse
                grade.setGradeValue(updatedGrade.getGradeValue());
                grade.setGradeDate(updatedGrade.getGradeDate());
                return gradeRepository.save(grade);
            })
            .orElseThrow(() -> new RuntimeException("Grade not found with ID " + id));
    }

    public void deleteGrade(Long id) {
        gradeRepository.deleteById(id);
    }

    /**
     * Get all grades for a specific enrolled course
     */
    public Optional<Grade> getGradeByEnrolledCourse(EnrolledCourse enrolledCourse) {
        return gradeRepository.findByEnrolledCourse(enrolledCourse);
    }

    /**
     * Get all grades for a student in a specific semester
     */
    public List<Grade> getGradesByStudentAndSemester(Student student, String semester, String academicYear) {
        return gradeRepository.findGradesByStudentAndSemester(student, semester, academicYear);
    }

    /**
     * Get all grades for a student across all semesters
     */
    public List<Grade> getGradesByStudent(Student student) {
        return gradeRepository.findGradesByStudent(student);
    }

    /**
     * Create or update grade for an enrolled course
     */
    public Grade createOrUpdateGradeForEnrolledCourse(Long enrolledCourseId, BigDecimal gradeValue) {
        EnrolledCourse enrolledCourse = enrolledCourseRepository.findById(enrolledCourseId)
            .orElseThrow(() -> new RuntimeException("Enrolled Course not found with ID " + enrolledCourseId));

        // Check if grade already exists
        Optional<Grade> existingGrade = gradeRepository.findByEnrolledCourse(enrolledCourse);
        
        if (existingGrade.isPresent()) {
            // Update existing grade
            Grade grade = existingGrade.get();
            grade.setGradeValue(gradeValue);
            grade.setGradeDate(java.time.LocalDate.now());
            return gradeRepository.save(grade);
        } else {
            // Create new grade
            Grade newGrade = Grade.builder()
                .enrolledCourse(enrolledCourse)
                .gradeValue(gradeValue)
                .gradeDate(java.time.LocalDate.now())
                .build();
            return gradeRepository.save(newGrade);
        }
    }

    /**
     * Get grades by semester enrollment
     */
    public List<Grade> getGradesBySemesterEnrollment(SemesterEnrollment semesterEnrollment) {
        return gradeRepository.findGradesBySemesterEnrollment(semesterEnrollment);
    }

    /**
     * Check if a student has completed all requirements for a course
     */
    public boolean hasPassingGrade(EnrolledCourse enrolledCourse) {
        Optional<Grade> grade = gradeRepository.findByEnrolledCourse(enrolledCourse);
        if (grade.isPresent()) {
            BigDecimal gradeValue = grade.get().getGradeValue();
            return gradeValue != null && gradeValue.compareTo(new BigDecimal("60.0")) >= 0;
        }
        return false;
    }

    /**
     * Check if grade is within valid range
     */
    public boolean isValidGrade(BigDecimal gradeValue) {
        return gradeValue != null && 
               gradeValue.compareTo(BigDecimal.ZERO) >= 0 && 
               gradeValue.compareTo(new BigDecimal("100.0")) <= 0;
    }

    /**
     * Calculate average grade for a student in a semester
     */
    public BigDecimal calculateAverageGrade(Student student, String semester, String academicYear) {
        List<Grade> grades = getGradesByStudentAndSemester(student, semester, academicYear);
        
        if (grades.isEmpty()) {
            return null;
        }

        BigDecimal sum = grades.stream()
            .filter(grade -> grade.getGradeValue() != null)
            .map(Grade::getGradeValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        long count = grades.stream()
            .filter(grade -> grade.getGradeValue() != null)
            .count();

        return count > 0 ? sum.divide(new BigDecimal(count), 2, RoundingMode.HALF_UP) : null;
    }

    /**
     * Calculate cumulative average grade for a student
     */
    public BigDecimal calculateCumulativeAverageGrade(Student student) {
        List<Grade> allGrades = getGradesByStudent(student);
        
        if (allGrades.isEmpty()) {
            return null;
        }

        BigDecimal sum = allGrades.stream()
            .filter(grade -> grade.getGradeValue() != null)
            .map(Grade::getGradeValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
            
        long count = allGrades.stream()
            .filter(grade -> grade.getGradeValue() != null)
            .count();

        return count > 0 ? sum.divide(new BigDecimal(count), 2, RoundingMode.HALF_UP) : null;
    }

    /**
     * Get transcript data for a student
     */
    public List<Grade> getTranscriptGrades(Student student) {
        return gradeRepository.findGradesByStudentOrderBySemester(student);
    }

    /**
     * Get grades by grade value range
     */
    public List<Grade> getGradesByRange(BigDecimal minGrade, BigDecimal maxGrade) {
        return gradeRepository.findByGradeValueBetween(minGrade, maxGrade);
    }

    /**
     * Get failing grades (below 60)
     */
    public List<Grade> getFailingGrades() {
        return gradeRepository.findByGradeValueLessThan(new BigDecimal("60.0"));
    }

    /**
     * Get honor grades (90 and above)
     */
    public List<Grade> getHonorGrades() {
        return gradeRepository.findByGradeValueGreaterThanEqual(new BigDecimal("90.0"));
    }
}
