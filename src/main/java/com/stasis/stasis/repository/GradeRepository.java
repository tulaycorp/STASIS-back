package com.stasis.stasis.repository;

import com.stasis.stasis.model.Grade;
import com.stasis.stasis.model.SemesterEnrollment;
import com.stasis.stasis.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {
    
    
    // Find grades by grade value range
    List<Grade> findByGradeValueBetween(BigDecimal minGrade, BigDecimal maxGrade);
    
    // Find failing grades (below specified value)
    List<Grade> findByGradeValueLessThan(BigDecimal gradeValue);
    
    // Find honor grades (above or equal to specified value)
    List<Grade> findByGradeValueGreaterThanEqual(BigDecimal gradeValue);
    
    // Custom queries for complex relationships
    @Query("SELECT g FROM EnrolledCourse ec JOIN ec.grade g JOIN ec.semesterEnrollment se WHERE se.student = :student AND se.semester = :semester AND se.academicYear = :academicYear")
    List<Grade> findGradesByStudentAndSemester(@Param("student") Student student, 
                                              @Param("semester") String semester, 
                                              @Param("academicYear") String academicYear);
    
    @Query("SELECT g FROM EnrolledCourse ec JOIN ec.grade g JOIN ec.semesterEnrollment se WHERE se.student = :student")
    List<Grade> findGradesByStudent(@Param("student") Student student);
    
    @Query("SELECT g FROM EnrolledCourse ec JOIN ec.grade g WHERE ec.semesterEnrollment = :semesterEnrollment")
    List<Grade> findGradesBySemesterEnrollment(@Param("semesterEnrollment") SemesterEnrollment semesterEnrollment);
    
    @Query("SELECT g FROM EnrolledCourse ec JOIN ec.grade g JOIN ec.semesterEnrollment se WHERE se.student = :student ORDER BY se.academicYear, se.semester")
    List<Grade> findGradesByStudentOrderBySemester(@Param("student") Student student);
}
