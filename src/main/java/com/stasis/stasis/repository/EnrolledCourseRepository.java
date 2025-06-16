package com.stasis.stasis.repository;

import com.stasis.stasis.model.EnrolledCourse;
import com.stasis.stasis.model.SemesterEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EnrolledCourseRepository extends JpaRepository<EnrolledCourse, Long> {
    List<EnrolledCourse> findBySemesterEnrollment(SemesterEnrollment semesterEnrollment);
}