package com.stasis.stasis.repository;

import com.stasis.stasis.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByFirstNameAndLastName(String firstName, String lastName);

    Optional<Student> findByEmail(String email);
    
    @Query("SELECT COUNT(s) FROM Student s WHERE s.curriculum.curriculumID = :curriculumId")
    Long countStudentsByCurriculumId(@Param("curriculumId") Long curriculumId);
}
