package com.stasis.stasis.repository;

import com.stasis.stasis.model.CourseSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseSectionRepository extends JpaRepository<CourseSection, Long> {
    
    // Find by section name
    List<CourseSection> findBySectionName(String sectionName);
    
    // Find by semester and year
    List<CourseSection> findBySemesterAndYear(String semester, int year);
    
    // Find by course
    List<CourseSection> findByCourse_Id(Long courseId);
    
    // Find by faculty with optimized fetch joins
    @Query("SELECT cs FROM CourseSection cs " +
           "JOIN FETCH cs.course c " +
           "JOIN FETCH cs.program p " +
           "JOIN FETCH cs.faculty f " +
           "LEFT JOIN FETCH cs.schedule s " +
           "WHERE cs.faculty.facultyID = :facultyId")
    List<CourseSection> findByFaculty_FacultyID(@Param("facultyId") Long facultyId);
    
    // Find by program ID
    List<CourseSection> findByProgramProgramID(Long programId);
    
    // Find by schedule status
    List<CourseSection> findByScheduleStatus(String status);
    
    // Find by schedule day
    List<CourseSection> findByScheduleDay(String day);
    
    // Find by schedule room
    List<CourseSection> findByScheduleRoom(String room);
}
