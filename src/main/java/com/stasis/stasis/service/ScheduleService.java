package com.stasis.stasis.service;

import com.stasis.stasis.model.CourseSection;
import com.stasis.stasis.model.Schedule;
import com.stasis.stasis.repository.CourseSectionRepository;
import com.stasis.stasis.repository.ScheduleRepository;
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
    
    @Transactional(readOnly = true)
    public List<Schedule> getAllSchedules() {
        List<Schedule> schedules = scheduleRepository.findAll();
        
        // Ensure related entities are loaded for each schedule
        schedules.forEach(schedule -> {
            if (schedule.getCourseSection() != null) {
                // Access the course to ensure it's loaded
                if (schedule.getCourseSection().getCourse() != null) {
                    // Access properties to force loading
                    schedule.getCourseSection().getCourse().getCourseCode();
                    schedule.getCourseSection().getCourse().getCourseDescription();
                }
                // Access faculty to ensure it's loaded
                if (schedule.getCourseSection().getFaculty() != null) {
                    schedule.getCourseSection().getFaculty().getFirstName();
                    schedule.getCourseSection().getFaculty().getLastName();
                }
            }
        });
        
        return schedules;
    }
    
    @Transactional(readOnly = true)
    public Optional<Schedule> getScheduleById(Long id) {
        Optional<Schedule> schedule = scheduleRepository.findById(id);
        // Ensure related entities are loaded
        schedule.ifPresent(s -> {
            if (s.getCourseSection() != null) {
                // Access the course to ensure it's loaded
                if (s.getCourseSection().getCourse() != null) {
                    s.getCourseSection().getCourse().getCourseCode();
                }
            }
        });
        return schedule;
    }
    
    @Transactional
    public Schedule createSchedule(Schedule schedule) {
        // Validate that course section ID is provided
        if (schedule.getCourseSectionId() == null) {
            throw new IllegalArgumentException("Course section ID is required");
        }
        
        // Find the existing course section by ID
        CourseSection existingSection = courseSectionRepository.findById(schedule.getCourseSectionId())
            .orElseThrow(() -> new IllegalArgumentException("Course section not found with ID: " + schedule.getCourseSectionId()));
        
        // Set the existing section on the schedule
        schedule.setCourseSection(existingSection);
        
        // Save and return the schedule
        Schedule savedSchedule = scheduleRepository.save(schedule);
        
        // Force loading of related entities to ensure they're included in the response
        if (savedSchedule.getCourseSection() != null) {
            // Force loading of course
            if (savedSchedule.getCourseSection().getCourse() != null) {
                savedSchedule.getCourseSection().getCourse().getCourseCode();
            }
            // Force loading of faculty
            if (savedSchedule.getCourseSection().getFaculty() != null) {
                savedSchedule.getCourseSection().getFaculty().getFirstName();
            }
        }
        
        return savedSchedule;
    }
    
    @Transactional
    public Schedule updateSchedule(Long id, Schedule scheduleDetails) {
        Schedule schedule = scheduleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Schedule not found with id: " + id));
        
        // Update basic properties
        schedule.setStartTime(scheduleDetails.getStartTime());
        schedule.setEndTime(scheduleDetails.getEndTime());
        schedule.setDay(scheduleDetails.getDay());
        schedule.setRoom(scheduleDetails.getRoom());
        schedule.setStatus(scheduleDetails.getStatus());
        
        // Handle course section relationship only if provided
        if (scheduleDetails.getCourseSectionId() != null) {
            CourseSection existingSection = courseSectionRepository.findById(scheduleDetails.getCourseSectionId())
                .orElseThrow(() -> new IllegalArgumentException("Course section not found with ID: " + scheduleDetails.getCourseSectionId()));
            schedule.setCourseSection(existingSection);
        }
        
        return scheduleRepository.save(schedule);
    }
    
    public void deleteSchedule(Long id) {
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
}