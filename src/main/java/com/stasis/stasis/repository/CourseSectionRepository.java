package com.stasis.stasis.repository;

import com.stasis.stasis.model.CourseSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseSectionRepository extends JpaRepository<CourseSection, Long> {
}
