package com.stasis.stasis.service;

import com.stasis.stasis.model.CoursePrerequisite;
import com.stasis.stasis.model.Course;
import com.stasis.stasis.repository.CoursePrerequisiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CoursePrerequisiteService {

    @Autowired
    private CoursePrerequisiteRepository coursePrerequisiteRepository;

    public List<CoursePrerequisite> getAllCoursePrerequisites() {
        return coursePrerequisiteRepository.findAll();
    }

    public Optional<CoursePrerequisite> getCoursePrerequisiteById(Long id) {
        return coursePrerequisiteRepository.findById(id);
    }

    public List<CoursePrerequisite> getPrerequisitesByCourse(Course course) {
        return coursePrerequisiteRepository.findByCourse(course);
    }

    public List<CoursePrerequisite> getCoursesByPrerequisite(Course prerequisiteCourse) {
        return coursePrerequisiteRepository.findByPrerequisiteCourse(prerequisiteCourse);
    }

    public CoursePrerequisite createCoursePrerequisite(CoursePrerequisite coursePrerequisite) {
        // Check if prerequisite relationship already exists
        List<CoursePrerequisite> existing = coursePrerequisiteRepository.findByCourse(coursePrerequisite.getCourse());
        boolean alreadyExists = existing.stream()
            .anyMatch(cp -> cp.getPrerequisiteCourse().equals(coursePrerequisite.getPrerequisiteCourse()));
        
        if (alreadyExists) {
            throw new RuntimeException("Prerequisite relationship already exists");
        }
        
        // Check for circular dependency
        if (hasCircularDependency(coursePrerequisite.getCourse(), coursePrerequisite.getPrerequisiteCourse())) {
            throw new RuntimeException("Cannot create prerequisite: would create circular dependency");
        }
        
        return coursePrerequisiteRepository.save(coursePrerequisite);
    }

    public CoursePrerequisite updateCoursePrerequisite(Long id, CoursePrerequisite updatedCoursePrerequisite) {
        return coursePrerequisiteRepository.findById(id)
            .map(coursePrerequisite -> {
                // Check for circular dependency with new values
                if (hasCircularDependency(updatedCoursePrerequisite.getCourse(), updatedCoursePrerequisite.getPrerequisiteCourse())) {
                    throw new RuntimeException("Cannot update prerequisite: would create circular dependency");
                }
                
                coursePrerequisite.setCourse(updatedCoursePrerequisite.getCourse());
                coursePrerequisite.setPrerequisiteCourse(updatedCoursePrerequisite.getPrerequisiteCourse());
                return coursePrerequisiteRepository.save(coursePrerequisite);
            })
            .orElseThrow(() -> new RuntimeException("Course Prerequisite not found with ID " + id));
    }

    public void deleteCoursePrerequisite(Long id) {
        coursePrerequisiteRepository.deleteById(id);
    }

    public boolean addPrerequisiteToCourse(Course course, Course prerequisiteCourse) {
        try {
            CoursePrerequisite coursePrerequisite = CoursePrerequisite.builder()
                .course(course)
                .prerequisiteCourse(prerequisiteCourse)
                .build();
            createCoursePrerequisite(coursePrerequisite);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public void removePrerequisiteFromCourse(Course course, Course prerequisiteCourse) {
        List<CoursePrerequisite> prerequisites = coursePrerequisiteRepository.findByCourse(course);
        prerequisites.stream()
            .filter(cp -> cp.getPrerequisiteCourse().equals(prerequisiteCourse))
            .forEach(cp -> coursePrerequisiteRepository.deleteById(cp.getCoursePrerequisiteID()));
    }

    private boolean hasCircularDependency(Course course, Course prerequisite) {
        // Simple check: if prerequisite course has the main course as its prerequisite
        List<CoursePrerequisite> prereqOfPrereq = coursePrerequisiteRepository.findByCourse(prerequisite);
        return prereqOfPrereq.stream()
            .anyMatch(cp -> cp.getPrerequisiteCourse().equals(course));
    }

    public boolean hasPrerequisites(Course course) {
        return !coursePrerequisiteRepository.findByCourse(course).isEmpty();
    }

    public boolean isPrerequisiteFor(Course course) {
        return !coursePrerequisiteRepository.findByPrerequisiteCourse(course).isEmpty();
    }
}
