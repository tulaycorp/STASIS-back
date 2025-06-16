package com.stasis.stasis.controller;

import com.stasis.stasis.model.CoursePrerequisite;
import com.stasis.stasis.model.Course;
import com.stasis.stasis.service.CoursePrerequisiteService;
import com.stasis.stasis.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/course-prerequisites")
public class CoursePrerequisiteController {

    @Autowired
    private CoursePrerequisiteService coursePrerequisiteService;

    @Autowired
    private CourseService courseService;

    @GetMapping
    public List<CoursePrerequisite> getAllCoursePrerequisites() {
        return coursePrerequisiteService.getAllCoursePrerequisites();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CoursePrerequisite> getCoursePrerequisiteById(@PathVariable Long id) {
        return coursePrerequisiteService.getCoursePrerequisiteById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<CoursePrerequisite>> getPrerequisitesByCourse(@PathVariable Long courseId) {
        Optional<Course> courseOpt = courseService.getCourseById(courseId);
        if (courseOpt.isPresent()) {
            List<CoursePrerequisite> prerequisites = coursePrerequisiteService.getPrerequisitesByCourse(courseOpt.get());
            return ResponseEntity.ok(prerequisites);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/prerequisite-for/{courseId}")
    public ResponseEntity<List<CoursePrerequisite>> getCoursesByPrerequisite(@PathVariable Long courseId) {
        Optional<Course> courseOpt = courseService.getCourseById(courseId);
        if (courseOpt.isPresent()) {
            List<CoursePrerequisite> courses = coursePrerequisiteService.getCoursesByPrerequisite(courseOpt.get());
            return ResponseEntity.ok(courses);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<CoursePrerequisite> createCoursePrerequisite(@RequestBody CoursePrerequisite coursePrerequisite) {
        try {
            CoursePrerequisite created = coursePrerequisiteService.createCoursePrerequisite(coursePrerequisite);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/course/{courseId}/prerequisite/{prerequisiteId}")
    public ResponseEntity<String> addPrerequisiteToCourse(@PathVariable Long courseId, @PathVariable Long prerequisiteId) {
        Optional<Course> courseOpt = courseService.getCourseById(courseId);
        Optional<Course> prerequisiteOpt = courseService.getCourseById(prerequisiteId);
        
        if (courseOpt.isPresent() && prerequisiteOpt.isPresent()) {
            boolean added = coursePrerequisiteService.addPrerequisiteToCourse(courseOpt.get(), prerequisiteOpt.get());
            if (added) {
                return ResponseEntity.ok("Prerequisite added successfully");
            } else {
                return ResponseEntity.badRequest().body("Failed to add prerequisite");
            }
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<CoursePrerequisite> updateCoursePrerequisite(@PathVariable Long id, @RequestBody CoursePrerequisite coursePrerequisite) {
        try {
            return ResponseEntity.ok(coursePrerequisiteService.updateCoursePrerequisite(id, coursePrerequisite));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoursePrerequisite(@PathVariable Long id) {
        coursePrerequisiteService.deleteCoursePrerequisite(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/course/{courseId}/prerequisite/{prerequisiteId}")
    public ResponseEntity<String> removePrerequisiteFromCourse(@PathVariable Long courseId, @PathVariable Long prerequisiteId) {
        Optional<Course> courseOpt = courseService.getCourseById(courseId);
        Optional<Course> prerequisiteOpt = courseService.getCourseById(prerequisiteId);
        
        if (courseOpt.isPresent() && prerequisiteOpt.isPresent()) {
            coursePrerequisiteService.removePrerequisiteFromCourse(courseOpt.get(), prerequisiteOpt.get());
            return ResponseEntity.ok("Prerequisite removed successfully");
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/course/{courseId}/has-prerequisites")
    public ResponseEntity<Boolean> hasPrerequisites(@PathVariable Long courseId) {
        Optional<Course> courseOpt = courseService.getCourseById(courseId);
        if (courseOpt.isPresent()) {
            boolean hasPrereqs = coursePrerequisiteService.hasPrerequisites(courseOpt.get());
            return ResponseEntity.ok(hasPrereqs);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/course/{courseId}/is-prerequisite")
    public ResponseEntity<Boolean> isPrerequisiteFor(@PathVariable Long courseId) {
        Optional<Course> courseOpt = courseService.getCourseById(courseId);
        if (courseOpt.isPresent()) {
            boolean isPrereq = coursePrerequisiteService.isPrerequisiteFor(courseOpt.get());
            return ResponseEntity.ok(isPrereq);
        }
        return ResponseEntity.notFound().build();
    }
}
