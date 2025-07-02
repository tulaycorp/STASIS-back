package com.stasis.stasis.repository;

import com.stasis.stasis.model.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    
    // Find by status
    List<Schedule> findByStatus(String status);
    
    // Find by day
    List<Schedule> findByDay(String day);
    
    // Find by room
    List<Schedule> findByRoom(String room);
    
    // Find schedules with time conflicts
    @Query("SELECT s FROM Schedule s WHERE s.day = ?1 AND " +
           "((s.startTime <= ?2 AND s.endTime > ?2) OR " +
           "(s.startTime < ?3 AND s.endTime >= ?3) OR " +
           "(s.startTime >= ?2 AND s.endTime <= ?3))")
    List<Schedule> findConflictingSchedules(String day, LocalTime startTime, LocalTime endTime);
    
    // Find schedules by time range
    @Query("SELECT s FROM Schedule s WHERE " +
           "s.startTime >= ?1 AND s.endTime <= ?2")
    List<Schedule> findSchedulesByTimeRange(LocalTime startTime, LocalTime endTime);
}