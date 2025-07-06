package com.stasis.stasis.controller;

import com.stasis.stasis.model.CourseSection;
import com.stasis.stasis.model.Schedule;
import com.stasis.stasis.service.CourseSectionService;
import com.stasis.stasis.service.ScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/course-sections")
public class CourseSectionController {

    @Autowired
    private CourseSectionService courseSectionService;
    
    @Autowired
    private ScheduleService scheduleService;

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
        List<CourseSection> sections = courseSectionService.getActiveSections();
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

    @GetMapping("/faculty/{facultyId}")
    public ResponseEntity<List<CourseSection>> getSectionsByFaculty(@PathVariable Long facultyId) {
        try {
            List<CourseSection> sections = courseSectionService.getSectionsByFaculty(facultyId);
            return ResponseEntity.ok(sections);
        } catch (Exception e) {
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    // Validation endpoint
    @PostMapping("/validate")
    public ResponseEntity<String> validateSection(@RequestBody CourseSection section) {
        if (section.getSectionName() == null || section.getSectionName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Section name is required");
        }
        
        if (section.getSchedules() != null && !section.getSchedules().isEmpty()) {
            for (var schedule : section.getSchedules()) {
                if (schedule.getStartTime() == null || schedule.getEndTime() == null) {
                    return ResponseEntity.badRequest().body("Start time and end time are required for all schedules");
                }
                if (schedule.getStartTime().isAfter(schedule.getEndTime())) {
                    return ResponseEntity.badRequest().body("Start time must be before end time for all schedules");
                }
                if (schedule.getDay() == null || schedule.getDay().trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("Day is required for all schedules");
                }
            }
        }
        
        return ResponseEntity.ok("Section data is valid");
    }

    // Schedule management endpoints for course sections
    @GetMapping("/{id}/schedules")
    public ResponseEntity<List<Schedule>> getSectionSchedules(@PathVariable Long id) {
        return courseSectionService.getSectionById(id)
            .map(section -> {
                List<Schedule> schedules = section.getSchedules() != null ? section.getSchedules() : Collections.emptyList();
                return ResponseEntity.ok(schedules);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/schedules")
    public ResponseEntity<Schedule> addScheduleToSection(@PathVariable Long id, @RequestBody Schedule schedule) {
        try {
            Schedule savedSchedule = scheduleService.createSchedule(schedule, id);
            return ResponseEntity.ok(savedSchedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}/schedules/{scheduleId}")
    public ResponseEntity<Void> removeScheduleFromSection(@PathVariable Long id, @PathVariable Long scheduleId) {
        try {
            scheduleService.deleteSchedule(scheduleId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
