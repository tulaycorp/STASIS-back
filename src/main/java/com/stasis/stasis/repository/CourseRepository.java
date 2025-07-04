package com.stasis.stasis.repository;

import com.stasis.stasis.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    // Custom query that trims both the database value and the parameter for comparison
    @Query("SELECT c FROM Course c WHERE TRIM(c.program) = TRIM(:program)")
    List<Course> findByProgram(@Param("program") String program);
}
