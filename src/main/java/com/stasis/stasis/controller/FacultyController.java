package com.stasis.stasis.controller;

import com.stasis.stasis.model.Faculty;
import com.stasis.stasis.service.FacultyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculty")
@CrossOrigin(origins = "http://localhost:3000") // Add CORS support
public class FacultyController {

    @Autowired
    private FacultyService facultyService;

    @GetMapping
    public List<Faculty> getAllFaculty() {
        return facultyService.getAllFaculty();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Faculty> getFacultyById(@PathVariable Long id) {
        return facultyService.getFacultyById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<FacultyService.FacultyWithCredentials> createFaculty(@RequestBody Faculty faculty) {
        try {
            // Check if email already exists
            if (facultyService.existsByEmail(faculty.getEmail())) {
                return ResponseEntity.badRequest().build();
            }
            FacultyService.FacultyWithCredentials created = facultyService.createFaculty(faculty);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Faculty> updateFaculty(@PathVariable Long id, @RequestBody Faculty faculty) {
        try {
            return ResponseEntity.ok(facultyService.updateFaculty(id, faculty));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFaculty(@PathVariable Long id) {
        facultyService.deleteFaculty(id);
        return ResponseEntity.noContent().build();
    }

    // Add new endpoints for Faculty-specific operations
    @GetMapping("/program/{programId}")
    public ResponseEntity<List<Faculty>> getFacultyByProgram(@PathVariable Long programId) {
        List<Faculty> faculty = facultyService.getFacultyByProgram(programId);
        return ResponseEntity.ok(faculty);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Faculty>> getFacultyByStatus(@PathVariable String status) {
        List<Faculty> faculty = facultyService.getFacultyByStatus(status);
        return ResponseEntity.ok(faculty);
    }

    @GetMapping("/position/{position}")
    public ResponseEntity<List<Faculty>> getFacultyByPosition(@PathVariable String position) {
        List<Faculty> faculty = facultyService.getFacultyByPosition(position);
        return ResponseEntity.ok(faculty);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Faculty>> searchFaculty(@RequestParam String searchTerm) {
        List<Faculty> faculty = facultyService.searchFacultyByName(searchTerm);
        return ResponseEntity.ok(faculty);
    }

    @GetMapping("/active")
    public ResponseEntity<List<Faculty>> getActiveFaculty() {
        List<Faculty> faculty = facultyService.getActiveFaculty();
        return ResponseEntity.ok(faculty);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Faculty> updateFacultyStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            Faculty updated = facultyService.updateFacultyStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<Faculty> getFacultyByEmail(@PathVariable String email) {
        return facultyService.getFacultyByEmail(email)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/email-exists/{email}")
    public ResponseEntity<Boolean> checkEmailExists(@PathVariable String email) {
        boolean exists = facultyService.existsByEmail(email);
        return ResponseEntity.ok(exists);
    }

    // Validation endpoint for creating faculty
    @PostMapping("/validate")
    public ResponseEntity<String> validateFaculty(@RequestBody Faculty faculty) {
        if (faculty.getFirstName() == null || faculty.getFirstName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("First name is required");
        }
        if (faculty.getLastName() == null || faculty.getLastName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Last name is required");
        }
        if (faculty.getEmail() == null || faculty.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        if (facultyService.existsByEmail(faculty.getEmail())) {
            return ResponseEntity.badRequest().body("Email already exists");
        }
        return ResponseEntity.ok("Faculty data is valid");
    }
}
