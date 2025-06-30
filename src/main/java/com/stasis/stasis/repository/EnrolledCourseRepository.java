package com.stasis.stasis.repository;

import com.stasis.stasis.model.EnrolledCourse;
import com.stasis.stasis.model.SemesterEnrollment;
import com.stasis.stasis.model.CourseSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EnrolledCourseRepository extends JpaRepository<EnrolledCourse, Long> {
    List<EnrolledCourse> findBySemesterEnrollment(SemesterEnrollment semesterEnrollment);

    @Query("SELECT ec FROM EnrolledCourse ec " +
           "LEFT JOIN FETCH ec.semesterEnrollment se " +
           "LEFT JOIN FETCH se.student st " +
           "LEFT JOIN FETCH st.program p " +
           "LEFT JOIN FETCH ec.section s " +
           "LEFT JOIN FETCH s.course c " +
           "LEFT JOIN FETCH ec.grade g " +
           "WHERE s.faculty.facultyID = :facultyId " +
           "AND st.program.programID = :programId")
    List<EnrolledCourse> findByFacultyAndProgram(
        @Param("facultyId") Long facultyId,
        @Param("programId") Long programId
    );

    @Query("SELECT ec FROM EnrolledCourse ec " +
           "LEFT JOIN FETCH ec.semesterEnrollment se " +
           "LEFT JOIN FETCH se.student st " +
           "LEFT JOIN FETCH st.program p " +
           "LEFT JOIN FETCH ec.section s " +
           "LEFT JOIN FETCH s.course c " +
           "LEFT JOIN FETCH s.faculty f " +
           "LEFT JOIN FETCH ec.grade g " +
           "WHERE s.faculty.facultyID = :facultyId")
    List<EnrolledCourse> findByFacultyId(@Param("facultyId") Long facultyId);
    
    @Query("SELECT ec FROM EnrolledCourse ec WHERE ec.semesterEnrollment.student.id = :studentId")
    List<EnrolledCourse> findByStudentId(@Param("studentId") Long studentId);
    
    // Alternative query that joins with section and course for better data loading
    @Query("SELECT ec FROM EnrolledCourse ec " +
           "LEFT JOIN FETCH ec.section s " +
           "LEFT JOIN FETCH s.course c " +
           "LEFT JOIN FETCH s.faculty f " +
           "WHERE ec.semesterEnrollment.student.id = :studentId")
    List<EnrolledCourse> findByStudentIdWithDetails(@Param("studentId") Long studentId);
    
    List<EnrolledCourse> findBySection(CourseSection section);
    
    @Query("SELECT ec FROM EnrolledCourse ec " +
           "LEFT JOIN FETCH ec.semesterEnrollment se " +
           "LEFT JOIN FETCH se.student st " +
           "LEFT JOIN FETCH st.program p " +
           "LEFT JOIN FETCH ec.section s " +
           "LEFT JOIN FETCH s.course c " +
           "LEFT JOIN FETCH ec.grade g " +
           "WHERE ec.section.sectionID = :sectionId")
    List<EnrolledCourse> findBySectionId(@Param("sectionId") Long sectionId);

    // New method to get enrollments by multiple section IDs
    @Query("SELECT ec FROM EnrolledCourse ec " +
           "LEFT JOIN FETCH ec.semesterEnrollment se " +
           "LEFT JOIN FETCH se.student st " +
           "LEFT JOIN FETCH st.program p " +
           "LEFT JOIN FETCH ec.section s " +
           "LEFT JOIN FETCH s.course c " +
           "LEFT JOIN FETCH s.faculty f " +
           "LEFT JOIN FETCH ec.grade g " +
           "WHERE ec.section.sectionID IN :sectionIds")
    List<EnrolledCourse> findBySectionIds(@Param("sectionIds") List<Long> sectionIds);

    // New method to get all enrollments for a specific course (across all sections)
    @Query("SELECT ec FROM EnrolledCourse ec " +
           "LEFT JOIN FETCH ec.semesterEnrollment se " +
           "LEFT JOIN FETCH se.student st " +
           "LEFT JOIN FETCH st.program p " +
           "LEFT JOIN FETCH ec.section s " +
           "LEFT JOIN FETCH s.course c " +
           "LEFT JOIN FETCH s.faculty f " +
           "LEFT JOIN FETCH ec.grade g " +
           "WHERE s.course.id = :courseId")
    List<EnrolledCourse> findByCourseId(@Param("courseId") Long courseId);
}
