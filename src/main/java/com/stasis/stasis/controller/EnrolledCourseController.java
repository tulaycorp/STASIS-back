package com.stasis.stasis.controller;

import com.stasis.stasis.model.EnrolledCourse;
import com.stasis.stasis.service.EnrolledCourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrolled-courses")
public class EnrolledCourseController {

    @Autowired
    private EnrolledCourseService enrolledCourseService;

    @GetMapping
    public List<EnrolledCourse> getAllEnrolledCourses() {
        return enrolledCourseService.getAllEnrolledCourses();
    }

    @GetMapping("/{id}")
    public ResponseEntity<EnrolledCourse> getEnrolledCourseById(@PathVariable Long id) {
        return enrolledCourseService.getEnrolledCourseById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/semester-enrollment/{semesterEnrollmentId}")
    public ResponseEntity<List<EnrolledCourse>> getEnrolledCoursesBySemesterEnrollment(
            @PathVariable Long semesterEnrollmentId) {
        // Note: You might want to inject SemesterEnrollmentService to get the SemesterEnrollment object
        // For now, this endpoint signature is prepared but would need the actual SemesterEnrollment object
        return ResponseEntity.ok().build(); // Placeholder - needs SemesterEnrollment object
    }

    @PostMapping
    public EnrolledCourse createEnrolledCourse(@RequestBody EnrolledCourse enrolledCourse) {
        return enrolledCourseService.createEnrolledCourse(enrolledCourse);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EnrolledCourse> updateEnrolledCourse(@PathVariable Long id, @RequestBody EnrolledCourse enrolledCourse) {
        try {
            return ResponseEntity.ok(enrolledCourseService.updateEnrolledCourse(id, enrolledCourse));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEnrolledCourse(@PathVariable Long id) {
        enrolledCourseService.deleteEnrolledCourse(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<String> updateEnrollmentStatus(@PathVariable Long id, @RequestParam String status) {
        boolean updated = enrolledCourseService.updateEnrollmentStatus(id, status);
        if (updated) {
            return ResponseEntity.ok("Enrollment status updated successfully");
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
