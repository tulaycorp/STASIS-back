package com.stasis.stasis.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.dao.DataIntegrityViolationException;

import com.stasis.stasis.model.Student;
import com.stasis.stasis.service.StudentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    public List<Student> getAllStudents() {
        return studentService.getAllStudents();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Long id) {
        return studentService.getStudentById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createStudent(@RequestBody Student student) {
        try {
            System.out.println("Received student data: " + student);
            StudentService.StudentWithCredentials studentWithCredentials = studentService.createStudent(student);
            System.out.println("Saved student: " + studentWithCredentials.getStudent());
            return ResponseEntity.ok(studentWithCredentials);
        } catch (DataIntegrityViolationException e) {
            System.err.println("Data integrity violation: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Email already exists in the system");
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Email already exists")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Email already exists in the system");
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Data validation error: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error creating student: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating student: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @RequestBody Student student) {
        try {
            Student updatedStudent = studentService.updateStudent(id, student);
            return ResponseEntity.ok(updatedStudent);
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("Email already exists")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Email already exists in the system");
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Data validation error: " + e.getMessage());
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Student not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Student not found with id " + id);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Error updating student: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating student: " + e.getMessage());
        }
    }
    
    @PutMapping("/{id}/promote")
    public ResponseEntity<Student> promoteStudent(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(studentService.promoteStudent(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }
}