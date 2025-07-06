package com.stasis.stasis.controller;

import com.stasis.stasis.model.CourseSection;
import com.stasis.stasis.model.Schedule;
import com.stasis.stasis.service.CourseSectionService;
import com.stasis.stasis.service.ScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @Autowired
    private CourseSectionService courseSectionService;
    
    @Autowired
    private ScheduleService scheduleService;

    @GetMapping("/sections-debug")
    public Object getSectionsDebug() {
        List<CourseSection> sections = courseSectionService.getAllSections();
        
        System.out.println("=== TEST DEBUG: Sections with Schedules ===");
        for (CourseSection section : sections) {
            System.out.println("Section " + section.getSectionID() + " (" + section.getSectionName() + "):");
            if (section.getSchedules() != null) {
                for (Schedule schedule : section.getSchedules()) {
                    System.out.println("  Schedule " + schedule.getScheduleID() + 
                        " - Course: " + (schedule.getCourse() != null ? 
                        schedule.getCourse().getCourseCode() + " (" + schedule.getCourse().getCourseDescription() + ")" : 
                        "NULL"));
                }
            } else {
                System.out.println("  No schedules");
            }
        }
        System.out.println("=== END DEBUG ===");
        
        // Return simplified data structure for frontend debugging
        return sections.stream().map(section -> {
            var sectionData = new java.util.HashMap<>();
            sectionData.put("sectionID", section.getSectionID());
            sectionData.put("sectionName", section.getSectionName());
            
            if (section.getSchedules() != null) {
                var schedules = section.getSchedules().stream().map(schedule -> {
                    var scheduleData = new java.util.HashMap<>();
                    scheduleData.put("scheduleID", schedule.getScheduleID());
                    scheduleData.put("day", schedule.getDay());
                    scheduleData.put("startTime", schedule.getStartTime());
                    scheduleData.put("endTime", schedule.getEndTime());
                    scheduleData.put("room", schedule.getRoom());
                    
                    if (schedule.getCourse() != null) {
                        var courseData = new java.util.HashMap<>();
                        courseData.put("id", schedule.getCourse().getId());
                        courseData.put("courseCode", schedule.getCourse().getCourseCode());
                        courseData.put("courseDescription", schedule.getCourse().getCourseDescription());
                        scheduleData.put("course", courseData);
                    } else {
                        scheduleData.put("course", null);
                    }
                    
                    return scheduleData;
                }).toList();
                sectionData.put("schedules", schedules);
            } else {
                sectionData.put("schedules", java.util.Collections.emptyList());
            }
            
            return sectionData;
        }).toList();
    }
    
    @PostMapping("/create-test-schedule")
    public Object createTestSchedule(@RequestParam Long sectionId, @RequestParam Long courseId) {
        try {
            // Create a test schedule with course assignment
            Schedule testSchedule = Schedule.builder()
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(10, 30))
                .day("Monday")
                .status("ACTIVE")
                .room("TEST-ROOM-101")
                .build();
            
            System.out.println("Creating test schedule for section " + sectionId + " and course " + courseId);
            Schedule savedSchedule = scheduleService.createScheduleWithCourse(testSchedule, sectionId, courseId);
            
            System.out.println("Test schedule created successfully:");
            System.out.println("Schedule ID: " + savedSchedule.getScheduleID());
            System.out.println("Course: " + (savedSchedule.getCourse() != null ? savedSchedule.getCourse().getCourseCode() : "NULL"));
            
            return "Test schedule created successfully with ID: " + savedSchedule.getScheduleID();
        } catch (Exception e) {
            System.err.println("Error creating test schedule: " + e.getMessage());
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
    }
}
