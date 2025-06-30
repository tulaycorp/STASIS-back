package com.stasis.stasis.controller;

import com.stasis.stasis.model.EnrolledCourse;
import com.stasis.stasis.service.EnrolledCourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/enrolled-courses")
@CrossOrigin(origins = "http://localhost:3000")
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

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<EnrolledCourse>> getEnrolledCoursesByStudent(@PathVariable Long studentId) {
        List<EnrolledCourse> enrolledCourses = enrolledCourseService.getEnrolledCoursesByStudent(studentId);
        return ResponseEntity.ok(enrolledCourses);
    }

    @GetMapping("/section/{sectionId}")
    public ResponseEntity<List<EnrolledCourse>> getEnrolledCoursesBySection(@PathVariable Long sectionId) {
        List<EnrolledCourse> enrolledCourses = enrolledCourseService.getEnrolledCoursesBySection(sectionId);
        return ResponseEntity.ok(enrolledCourses);
    }

    @PostMapping
    public EnrolledCourse createEnrolledCourse(@RequestBody Map<String, Object> enrollmentRequest) {
        Long studentId = Long.valueOf(enrollmentRequest.get("studentId").toString());
        Long courseSectionId = Long.valueOf(enrollmentRequest.get("courseSectionId").toString());
        String status = enrollmentRequest.get("status").toString();
        
        return enrolledCourseService.createEnrollmentForStudent(studentId, courseSectionId, status);
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

    @PutMapping("/{id}/grades")
    public ResponseEntity<EnrolledCourse> updateGrades(@PathVariable Long id, @RequestBody Map<String, Object> gradeData) {
        try {
            EnrolledCourse updated = enrolledCourseService.updateGrades(id, gradeData);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/midterm-grade")
    public ResponseEntity<EnrolledCourse> updateMidtermGrade(@PathVariable Long id, @RequestBody Map<String, Object> gradeData) {
        try {
            Double midtermGrade = Double.valueOf(gradeData.get("midtermGrade").toString());
            EnrolledCourse updated = enrolledCourseService.updateMidtermGrade(id, midtermGrade);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/final-grade")
    public ResponseEntity<EnrolledCourse> updateFinalGrade(@PathVariable Long id, @RequestBody Map<String, Object> gradeData) {
        try {
            Double finalGrade = Double.valueOf(gradeData.get("finalGrade").toString());
            EnrolledCourse updated = enrolledCourseService.updateFinalGrade(id, finalGrade);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/overall-grade")
    public ResponseEntity<EnrolledCourse> updateOverallGrade(@PathVariable Long id, @RequestBody Map<String, Object> gradeData) {
        try {
            Double overallGrade = Double.valueOf(gradeData.get("overallGrade").toString());
            EnrolledCourse updated = enrolledCourseService.updateOverallGrade(id, overallGrade);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/faculty/{facultyId}")
    public ResponseEntity<List<EnrolledCourse>> getEnrolledCoursesByFaculty(@PathVariable Long facultyId) {
        List<EnrolledCourse> enrolledCourses = enrolledCourseService.getEnrolledCoursesByFaculty(facultyId);
        return ResponseEntity.ok(enrolledCourses);
    }

    @GetMapping("/faculty/{facultyId}/program/{programId}")
    public ResponseEntity<List<EnrolledCourse>> getEnrolledCoursesByFacultyAndProgram(
            @PathVariable Long facultyId, 
            @PathVariable Long programId) {
        List<EnrolledCourse> enrolledCourses = enrolledCourseService.getEnrolledCoursesByFacultyAndProgram(facultyId, programId);
        return ResponseEntity.ok(enrolledCourses);
    }

    @GetMapping("/course/{courseId}/students")
    public ResponseEntity<List<EnrolledCourse>> getEnrolledStudentsByCourse(@PathVariable Long courseId) {
        List<EnrolledCourse> enrolledCourses = enrolledCourseService.getEnrolledCoursesByCourse(courseId);
        return ResponseEntity.ok(enrolledCourses);
    }
}
