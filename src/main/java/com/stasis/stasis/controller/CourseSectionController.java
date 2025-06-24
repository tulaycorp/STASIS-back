package com.stasis.stasis.controller;

import com.stasis.stasis.model.CourseSection;
import com.stasis.stasis.service.CourseSectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/course-sections")
@CrossOrigin(origins = "http://localhost:3000")
public class CourseSectionController {

    @Autowired
    private CourseSectionService courseSectionService;

    @GetMapping
    public List<CourseSection> getAllSections() {
        return courseSectionService.getAllSections();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseSection> getSectionById(@PathVariable Long id) {
        return courseSectionService.getSectionById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public CourseSection createSection(@RequestBody CourseSection section) {
        return courseSectionService.createSection(section);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseSection> updateSection(@PathVariable Long id, @RequestBody CourseSection section) {
        try {
            return ResponseEntity.ok(courseSectionService.updateSection(id, section));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSection(@PathVariable Long id) {
        courseSectionService.deleteSection(id);
        return ResponseEntity.noContent().build();
    }

    // New endpoints for enhanced functionality
    @GetMapping("/status/{status}")
    public ResponseEntity<List<CourseSection>> getSectionsByStatus(@PathVariable String status) {
        List<CourseSection> sections = courseSectionService.getSectionsByStatus(status);
        return ResponseEntity.ok(sections);
    }

    @GetMapping("/day/{day}")
    public ResponseEntity<List<CourseSection>> getSectionsByDay(@PathVariable String day) {
        List<CourseSection> sections = courseSectionService.getSectionsByDay(day);
        return ResponseEntity.ok(sections);
    }

    @GetMapping("/section-name/{sectionName}")
    public ResponseEntity<List<CourseSection>> getSectionsBySectionName(@PathVariable String sectionName) {
        List<CourseSection> sections = courseSectionService.getSectionsBySectionName(sectionName);
        return ResponseEntity.ok(sections);
    }

    @GetMapping("/active")
    public ResponseEntity<List<CourseSection>> getActiveSections() {
        List<CourseSection> sections = courseSectionService.getActiveSections();
        return ResponseEntity.ok(sections);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<CourseSection> updateSectionStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            CourseSection updated = courseSectionService.updateSectionStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/program/{programId}")
public ResponseEntity<List<CourseSection>> getSectionsByProgram(@PathVariable Long programId) {
    List<CourseSection> sections = courseSectionService.getSectionsByProgram(programId);
    return ResponseEntity.ok(sections);
}



    // Validation endpoint
    @PostMapping("/validate")
    public ResponseEntity<String> validateSection(@RequestBody CourseSection section) {
        if (section.getSectionName() == null || section.getSectionName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Section name is required");
        }
        if (section.getStartTime() == null || section.getEndTime() == null) {
            return ResponseEntity.badRequest().body("Start time and end time are required");
        }
        if (section.getStartTime().isAfter(section.getEndTime())) {
            return ResponseEntity.badRequest().body("Start time must be before end time");
        }
        if (section.getDay() == null || section.getDay().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Day is required");
        }
        return ResponseEntity.ok("Section data is valid");

    
    }
}
