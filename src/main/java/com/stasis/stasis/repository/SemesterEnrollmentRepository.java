package com.stasis.stasis.repository;

import com.stasis.stasis.model.SemesterEnrollment;
import com.stasis.stasis.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SemesterEnrollmentRepository extends JpaRepository<SemesterEnrollment, Long> {
    
    List<SemesterEnrollment> findByStudent(Student student);
    
    @Query("SELECT se FROM SemesterEnrollment se WHERE se.student.studentID = :studentId")
    List<SemesterEnrollment> findByStudentId(@Param("studentId") Long studentId);
    
    List<SemesterEnrollment> findBySemesterAndAcademicYear(String semester, String academicYear);
    
    @Query("SELECT se FROM SemesterEnrollment se WHERE se.student.studentID = :studentId AND se.semester = :semester AND se.academicYear = :academicYear")
    Optional<SemesterEnrollment> findByStudentAndSemesterAndYear(@Param("studentId") Long studentId, @Param("semester") String semester, @Param("academicYear") String academicYear);
    
    @Query("SELECT se FROM SemesterEnrollment se WHERE se.status = 'ACTIVE'")
    List<SemesterEnrollment> findActiveEnrollments();
    
    @Query("SELECT se FROM SemesterEnrollment se WHERE se.student.studentID = :studentId ORDER BY se.academicYear DESC, se.semester DESC")
    List<SemesterEnrollment> findByStudentIdOrderByDateDesc(@Param("studentId") Long studentId);
    
    @Query("SELECT se FROM SemesterEnrollment se WHERE se.totalCredits > :credits")
    List<SemesterEnrollment> findByTotalCreditsGreaterThan(@Param("credits") int credits);
}