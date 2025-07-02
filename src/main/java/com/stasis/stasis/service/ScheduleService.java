package com.stasis.stasis.service;

import com.stasis.stasis.model.Schedule;
import com.stasis.stasis.model.CourseSection;
import com.stasis.stasis.repository.ScheduleRepository;
import com.stasis.stasis.repository.CourseSectionRepository;
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
        return scheduleRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public Optional<Schedule> getScheduleById(Long id) {
        return scheduleRepository.findById(id);
    }
    
    @Transactional
    public Schedule createSchedule(Schedule schedule, Long courseSectionId) {
        Schedule savedSchedule = scheduleRepository.save(schedule);
        
        // Update the CourseSection with the new schedule
        if (courseSectionId != null) {
            CourseSection section = courseSectionRepository.findById(courseSectionId)
                .orElseThrow(() -> new IllegalArgumentException("Course section not found with id: " + courseSectionId));
            
            // If the section already has a schedule, delete the old one to avoid orphaned records
            if (section.getSchedule() != null) {
                scheduleRepository.delete(section.getSchedule());
            }
            
            section.setSchedule(savedSchedule);
            courseSectionRepository.save(section);
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
        
        return scheduleRepository.save(schedule);
    }
    
    @Transactional
    public void deleteSchedule(Long id) {
        // Detach schedule from any course section that references it
        CourseSection section = courseSectionRepository.findBySchedule_ScheduleID(id);
        if (section != null) {
            section.setSchedule(null);
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
}