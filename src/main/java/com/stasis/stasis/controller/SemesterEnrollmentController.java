package com.stasis.stasis.controller;

import com.stasis.stasis.model.SemesterEnrollment;
import com.stasis.stasis.service.SemesterEnrollmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/semester-enrollments")
@CrossOrigin(origins = "http://localhost:3000")
public class SemesterEnrollmentController {

    @Autowired
    private SemesterEnrollmentService semesterEnrollmentService;

    @GetMapping
    public List<SemesterEnrollment> getAllSemesterEnrollments() {
        return semesterEnrollmentService.getAllSemesterEnrollments();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SemesterEnrollment> getSemesterEnrollmentById(@PathVariable Long id) {
        Optional<SemesterEnrollment> enrollment = semesterEnrollmentService.getSemesterEnrollmentById(id);
        return enrollment.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public SemesterEnrollment createSemesterEnrollment(@RequestBody SemesterEnrollment semesterEnrollment) {
        return semesterEnrollmentService.createSemesterEnrollment(semesterEnrollment);
    }

    @PutMapping("/{id}")
    public SemesterEnrollment updateSemesterEnrollment(@PathVariable Long id, @RequestBody SemesterEnrollment semesterEnrollment) {
        return semesterEnrollmentService.updateSemesterEnrollment(id, semesterEnrollment);
    }

    @DeleteMapping("/{id}")
    public void deleteSemesterEnrollment(@PathVariable Long id) {
        semesterEnrollmentService.deleteSemesterEnrollment(id);
    }

    @GetMapping("/student/{studentId}")
    public List<SemesterEnrollment> getEnrollmentsByStudent(@PathVariable Long studentId) {
        return semesterEnrollmentService.getEnrollmentsByStudent(studentId);
    }

    @GetMapping("/semester")
    public List<SemesterEnrollment> getEnrollmentsBySemester(@RequestParam String semester, @RequestParam String academicYear) {
        return semesterEnrollmentService.getEnrollmentsBySemester(semester, academicYear);
    }

    @GetMapping("/current")
    public List<SemesterEnrollment> getCurrentEnrollments() {
        return semesterEnrollmentService.getCurrentEnrollments();
    }

    @PutMapping("/{id}/update-credits")
    public SemesterEnrollment updateTotalCredits(@PathVariable Long id) {
        return semesterEnrollmentService.updateTotalCredits(id);
    }
}