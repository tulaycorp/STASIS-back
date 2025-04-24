package com.stasis.stasis.controller;

import com.stasis.stasis.model.CourseSection;
import com.stasis.stasis.service.CourseSectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/course-sections")
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
}
