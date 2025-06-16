package com.stasis.stasis.repository;

import com.stasis.stasis.model.CoursePrerequisite;
import com.stasis.stasis.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CoursePrerequisiteRepository extends JpaRepository<CoursePrerequisite, Long> {
    List<CoursePrerequisite> findByCourse(Course course);
    List<CoursePrerequisite> findByPrerequisiteCourse(Course prerequisiteCourse);
}