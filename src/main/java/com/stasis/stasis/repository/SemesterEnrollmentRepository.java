package com.stasis.stasis.repository;

import com.stasis.stasis.model.SemesterEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SemesterEnrollmentRepository extends JpaRepository<SemesterEnrollment, Long> {
    
    // Use method name queries instead of custom @Query to avoid field name issues
    List<SemesterEnrollment> findByStudent_Id(Long studentId);
    
    Optional<SemesterEnrollment> findByStudent_IdAndSemesterAndAcademicYear(
        Long studentId, 
        String semester, 
        String academicYear
    );
    
    List<SemesterEnrollment> findBySemesterAndAcademicYear(String semester, String academicYear);
    
    List<SemesterEnrollment> findByAcademicYear(String academicYear);

    @Query("SELECT se FROM SemesterEnrollment se WHERE se.status = 'ACTIVE'")
    List<SemesterEnrollment> findActiveEnrollments();
}

