package com.stasis.stasis.repository;

import com.stasis.stasis.model.CourseSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;

@Repository
public interface CourseSectionRepository extends JpaRepository<CourseSection, Long> {
    
    // Find by status
    List<CourseSection> findByStatus(String status);
    
    // Find by day
    List<CourseSection> findByDay(String day);
    
    // Find by section name
    List<CourseSection> findBySectionName(String sectionName);
    
    // Find by semester and year
    List<CourseSection> findBySemesterAndYear(String semester, int year);
    
    // Find by course
    List<CourseSection> findByCourse_Id(Long courseId);
    
    // Find by faculty
    List<CourseSection> findByFaculty_FacultyID(Long facultyId);
    
    // Find by room
    List<CourseSection> findByRoom(String room);

    // Find by program ID
    List<CourseSection> findByProgramProgramID(Long programId);
    
    // Find sections with time conflicts
    @Query("SELECT cs FROM CourseSection cs WHERE cs.day = :day AND cs.status = 'ACTIVE' AND " +
           "((cs.startTime <= :endTime AND cs.endTime >= :startTime))")
    List<CourseSection> findConflictingSections(@Param("day") String day, 
                                               @Param("startTime") LocalTime startTime, 
                                               @Param("endTime") LocalTime endTime);
    
    // Find sections by time range
    @Query("SELECT cs FROM CourseSection cs WHERE cs.startTime >= :startTime AND cs.endTime <= :endTime")
    List<CourseSection> findSectionsByTimeRange(@Param("startTime") LocalTime startTime, 
                                               @Param("endTime") LocalTime endTime);
}
