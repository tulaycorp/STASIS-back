package com.stasis.stasis.controller;

import com.stasis.stasis.model.Schedule;
import com.stasis.stasis.service.ScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    @Autowired
    private ScheduleService scheduleService;

    @GetMapping
    public List<Schedule> getAllSchedules() {
        return scheduleService.getAllSchedules();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Schedule> getScheduleById(@PathVariable Long id) {
        return scheduleService.getScheduleById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createSchedule(
            @RequestParam(required = false) Long courseSectionId,
            @RequestBody Schedule schedule) {
        // Validate the required fields
        if (schedule.getStartTime() == null || schedule.getEndTime() == null) {
            return ResponseEntity.badRequest().body("Start time and end time are required");
        }
        if (schedule.getDay() == null || schedule.getDay().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Day is required");
        }
        
        try {
            Schedule createdSchedule = scheduleService.createSchedule(schedule, courseSectionId);
            return ResponseEntity.ok(createdSchedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create schedule: " + e.getMessage());
        }
    }
    
    @PostMapping("/with-course")
    public ResponseEntity<?> createScheduleWithCourse(
            @RequestParam(required = false) Long courseSectionId,
            @RequestParam(required = false) Long courseId,
            @RequestBody Schedule schedule) {
        // Validate the required fields
        if (schedule.getStartTime() == null || schedule.getEndTime() == null) {
            return ResponseEntity.badRequest().body("Start time and end time are required");
        }
        if (schedule.getDay() == null || schedule.getDay().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Day is required");
        }
        
        try {
            Schedule createdSchedule = scheduleService.createScheduleWithCourse(schedule, courseSectionId, courseId);
            return ResponseEntity.ok(createdSchedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create schedule: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Schedule> updateSchedule(@PathVariable Long id, @RequestBody Schedule schedule) {
        try {
            return ResponseEntity.ok(scheduleService.updateSchedule(id, schedule));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}/with-course")
    public ResponseEntity<Schedule> updateScheduleWithCourse(
            @PathVariable Long id, 
            @RequestParam(required = false) Long courseId,
            @RequestBody Schedule schedule) {
        try {
            return ResponseEntity.ok(scheduleService.updateScheduleWithCourse(id, schedule, courseId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Schedule>> getSchedulesByStatus(@PathVariable String status) {
        List<Schedule> schedules = scheduleService.getSchedulesByStatus(status);
        return ResponseEntity.ok(schedules);
    }

    @GetMapping("/day/{day}")
    public ResponseEntity<List<Schedule>> getSchedulesByDay(@PathVariable String day) {
        List<Schedule> schedules = scheduleService.getSchedulesByDay(day);
        return ResponseEntity.ok(schedules);
    }

    @GetMapping("/room/{room}")
    public ResponseEntity<List<Schedule>> getSchedulesByRoom(@PathVariable String room) {
        List<Schedule> schedules = scheduleService.getSchedulesByRoom(room);
        return ResponseEntity.ok(schedules);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Schedule> updateScheduleStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            Schedule updated = scheduleService.updateScheduleStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/conflicts/check")
    public ResponseEntity<List<Schedule>> checkConflicts(
            @RequestParam String day,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime,
            @RequestParam(required = false) Long excludeScheduleId) {
        List<Schedule> conflicts = scheduleService.checkConflicts(day, startTime, endTime, excludeScheduleId);
        return ResponseEntity.ok(conflicts);
    }

    @GetMapping("/conflicts")
    public ResponseEntity<List<Schedule>> getConflictingSchedules(
            @RequestParam String day,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {
        List<Schedule> schedules = scheduleService.findConflictingSchedules(day, startTime, endTime);
        return ResponseEntity.ok(schedules);
    }

    @GetMapping("/time-range")
    public ResponseEntity<List<Schedule>> getSchedulesByTimeRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {
        List<Schedule> schedules = scheduleService.findSchedulesByTimeRange(startTime, endTime);
        return ResponseEntity.ok(schedules);
    }
    
    @PostMapping("/validate")
    public ResponseEntity<?> validateSchedule(@RequestBody Schedule schedule) {
        if (schedule.getStartTime() == null || schedule.getEndTime() == null) {
            return ResponseEntity.badRequest().body("Start time and end time are required");
        }
        if (schedule.getStartTime().isAfter(schedule.getEndTime())) {
            return ResponseEntity.badRequest().body("Start time must be before end time");
        }
        if (schedule.getDay() == null || schedule.getDay().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Day is required");
        }
        return ResponseEntity.ok("Schedule data is valid");
    }
}
