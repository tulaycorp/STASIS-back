package com.stasis.stasis.service;

import com.stasis.stasis.model.Course;
import com.stasis.stasis.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Optional<Course> getCourseById(Long id) {
        return courseRepository.findById(id);
    }

    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    public Course updateCourse(Long id, Course updatedCourse) {
        return courseRepository.findById(id)
            .map(course -> {
                course.setCourseCode(updatedCourse.getCourseCode());
                course.setCredits(updatedCourse.getCredits());
                course.setCourseDescription(updatedCourse.getCourseDescription());
                course.setProgram(updatedCourse.getProgram());
                return courseRepository.save(course);
            })
            .orElseThrow(() -> new RuntimeException("Course not found with ID " + id));
    }

    public void deleteCourse(Long id) {
        courseRepository.deleteById(id);
    }
}
