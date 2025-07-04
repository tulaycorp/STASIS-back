package com.stasis.stasis.service;

import com.stasis.stasis.model.Schedule;
import com.stasis.stasis.model.CourseSection;
import com.stasis.stasis.model.Course;
import com.stasis.stasis.repository.ScheduleRepository;
import com.stasis.stasis.repository.CourseSectionRepository;
import com.stasis.stasis.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class ScheduleService {

    @Autowired
    private ScheduleRepository scheduleRepository;
    
    @Autowired
    private CourseSectionRepository courseSectionRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Transactional(readOnly = true)
    public List<Schedule> getAllSchedules() {
        return scheduleRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public Optional<Schedule> getScheduleById(Long id) {
        return scheduleRepository.findById(id);
    }
    
    @Transactional
    public Schedule createSchedule(Schedule schedule, Long courseSectionId) {
        // Validate schedule data
        validateScheduleData(schedule);
        
        // Check for schedule conflicts globally
        List<Schedule> conflicts = findConflictingSchedules(
            schedule.getDay(), 
            schedule.getStartTime(), 
            schedule.getEndTime()
        );
        
        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Schedule conflict detected: Time slot already occupied");
        }
        
        // If course is assigned, check for course-schedule conflicts within the same section
        if (schedule.getCourse() != null && courseSectionId != null) {
            validateCourseScheduleAssignment(schedule, courseSectionId, null);
        }
        
        Schedule savedSchedule = scheduleRepository.save(schedule);
        
        // Update the CourseSection with the new schedule
        if (courseSectionId != null) {
            CourseSection section = courseSectionRepository.findById(courseSectionId)
                .orElseThrow(() -> new IllegalArgumentException("Course section not found with id: " + courseSectionId));
            
            // Add schedule to the section's schedules list
            if (section.getSchedules() == null) {
                section.setSchedules(new java.util.ArrayList<>());
            }
            section.getSchedules().add(savedSchedule);
            courseSectionRepository.save(section);
        }
        
        return savedSchedule;
    }
    
    @Transactional
    public Schedule createScheduleWithCourse(Schedule schedule, Long courseSectionId, Long courseId) {
        System.out.println("=== ScheduleService.createScheduleWithCourse START ===");
        System.out.println("Schedule: " + schedule);
        System.out.println("Course Section ID: " + courseSectionId);
        System.out.println("Course ID: " + courseId);
        
        // Find and assign the course if provided
        if (courseId != null) {
            Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found with id: " + courseId));
            schedule.setCourse(course);
            System.out.println("Course assigned to schedule: " + course.getCourseCode() + " - " + course.getCourseDescription());
        }
        
        Schedule savedSchedule = createSchedule(schedule, courseSectionId);
        System.out.println("Schedule saved with ID: " + savedSchedule.getScheduleID());
        System.out.println("Schedule course after save: " + (savedSchedule.getCourse() != null ? savedSchedule.getCourse().getCourseCode() : "null"));
        System.out.println("=== ScheduleService.createScheduleWithCourse END ===");
        
        return savedSchedule;
    }
    
    private void validateScheduleData(Schedule schedule) {
        if (schedule.getStartTime() == null || schedule.getEndTime() == null) {
            throw new IllegalArgumentException("Start time and end time are required");
        }
        if (schedule.getStartTime().isAfter(schedule.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }
        if (schedule.getDay() == null || schedule.getDay().trim().isEmpty()) {
            throw new IllegalArgumentException("Day is required");
        }
    }
    
    private void validateCourseScheduleAssignment(Schedule schedule, Long courseSectionId, Long excludeScheduleId) {
        if (schedule.getCourse() == null) return;
        
        // Find all schedules for the same course in the same section
        CourseSection section = courseSectionRepository.findById(courseSectionId)
            .orElseThrow(() -> new IllegalArgumentException("Course section not found"));
            
        if (section.getSchedules() != null) {
            for (Schedule existingSchedule : section.getSchedules()) {
                // Skip the schedule being updated
                if (excludeScheduleId != null && existingSchedule.getScheduleID().equals(excludeScheduleId)) {
                    continue;
                }
                
                // Check if same course has conflicting schedule
                if (existingSchedule.getCourse() != null && 
                    existingSchedule.getCourse().getId().equals(schedule.getCourse().getId()) &&
                    existingSchedule.getDay().equals(schedule.getDay())) {
                    
                    // Check for time overlap
                    if (schedulesOverlap(existingSchedule, schedule)) {
                        throw new RuntimeException(
                            "Course schedule conflict: Course " + schedule.getCourse().getCourseCode() + 
                            " already has a conflicting schedule in this section"
                        );
                    }
                }
            }
        }
    }
    
    private boolean schedulesOverlap(Schedule schedule1, Schedule schedule2) {
        LocalTime start1 = schedule1.getStartTime();
        LocalTime end1 = schedule1.getEndTime();
        LocalTime start2 = schedule2.getStartTime();
        LocalTime end2 = schedule2.getEndTime();
        
        return (start1.isBefore(end2) && end1.isAfter(start2));
    }
    
    @Transactional
    public Schedule updateSchedule(Long id, Schedule scheduleDetails) {
        Schedule schedule = scheduleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Schedule not found with id: " + id));
        
        // Validate schedule data
        validateScheduleData(scheduleDetails);
        
        // Check for schedule conflicts globally (excluding current schedule)
        List<Schedule> conflicts = findConflictingSchedules(
            scheduleDetails.getDay(), 
            scheduleDetails.getStartTime(), 
            scheduleDetails.getEndTime()
        ).stream()
        .filter(conflictSchedule -> !conflictSchedule.getScheduleID().equals(id))
        .toList();
        
        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Schedule conflict detected: Time slot already occupied");
        }
        
        // Find the section this schedule belongs to
        CourseSection section = courseSectionRepository.findBySchedule_ScheduleID(id);
        if (section != null && scheduleDetails.getCourse() != null) {
            validateCourseScheduleAssignment(scheduleDetails, section.getSectionID(), id);
        }
        
        // Update basic properties
        schedule.setStartTime(scheduleDetails.getStartTime());
        schedule.setEndTime(scheduleDetails.getEndTime());
        schedule.setDay(scheduleDetails.getDay());
        schedule.setRoom(scheduleDetails.getRoom());
        schedule.setStatus(scheduleDetails.getStatus());
        schedule.setCourse(scheduleDetails.getCourse());
        
        return scheduleRepository.save(schedule);
    }
    
    @Transactional
    public Schedule updateScheduleWithCourse(Long id, Schedule scheduleDetails, Long courseId) {
        // Find and assign the course if provided
        if (courseId != null) {
            Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found with id: " + courseId));
            scheduleDetails.setCourse(course);
        }
        
        return updateSchedule(id, scheduleDetails);
    }
    
    @Transactional
    public void deleteSchedule(Long id) {
        // Detach schedule from any course section that references it
        CourseSection section = courseSectionRepository.findBySchedule_ScheduleID(id);
        if (section != null && section.getSchedules() != null) {
            section.getSchedules().removeIf(schedule -> schedule.getScheduleID().equals(id));
            courseSectionRepository.save(section);
        }
        // Now safe to delete
        scheduleRepository.deleteById(id);
    }
    
    public List<Schedule> getSchedulesByStatus(String status) {
        return scheduleRepository.findByStatus(status);
    }
    
    public List<Schedule> getSchedulesByDay(String day) {
        return scheduleRepository.findByDay(day);
    }
    
    public List<Schedule> getSchedulesByRoom(String room) {
        return scheduleRepository.findByRoom(room);
    }
    
    public Schedule updateScheduleStatus(Long id, String status) {
        Schedule schedule = scheduleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Schedule not found with id: " + id));
        
        schedule.setStatus(status);
        return scheduleRepository.save(schedule);
    }
    
    public List<Schedule> findConflictingSchedules(String day, LocalTime startTime, LocalTime endTime) {
        // Get schedules that overlap with the given time range on the same day
        return scheduleRepository.findConflictingSchedules(day, startTime, endTime);
    }
    
    public List<Schedule> findSchedulesByTimeRange(LocalTime startTime, LocalTime endTime) {
        // Get schedules that are within the given time range (on any day)
        return scheduleRepository.findSchedulesByTimeRange(startTime, endTime);
    }
    
    public List<Schedule> checkConflicts(String day, LocalTime startTime, LocalTime endTime, Long excludeScheduleId) {
        List<Schedule> conflicts = findConflictingSchedules(day, startTime, endTime);
        
        // Exclude the schedule being updated
        if (excludeScheduleId != null) {
            conflicts = conflicts.stream()
                .filter(schedule -> !schedule.getScheduleID().equals(excludeScheduleId))
                .toList();
        }
        
        return conflicts;
    }
}