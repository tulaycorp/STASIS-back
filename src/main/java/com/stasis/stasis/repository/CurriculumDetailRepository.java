package com.stasis.stasis.repository;

import com.stasis.stasis.model.CurriculumDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CurriculumDetailRepository extends JpaRepository<CurriculumDetail, Long> {
    
    @Query("SELECT cd FROM CurriculumDetail cd JOIN FETCH cd.course WHERE cd.curriculum.curriculumID = :curriculumId")
    List<CurriculumDetail> findByCurriculumId(@Param("curriculumId") Long curriculumId);
    
    // Use @Query instead of method name for capitalized field names
    @Query("SELECT cd FROM CurriculumDetail cd JOIN FETCH cd.course WHERE cd.YearLevel = :yearLevel")
    List<CurriculumDetail> findByYearLevel(@Param("yearLevel") int yearLevel);
    
    @Query("SELECT cd FROM CurriculumDetail cd JOIN FETCH cd.course WHERE cd.curriculum.curriculumID = :curriculumId AND cd.YearLevel = :yearLevel")
    List<CurriculumDetail> findByCurriculumIdAndYearLevel(@Param("curriculumId") Long curriculumId, @Param("yearLevel") int yearLevel);
    
    @Query("SELECT cd FROM CurriculumDetail cd JOIN FETCH cd.course WHERE cd.curriculum.curriculumID = :curriculumId AND cd.Semester = :semester")
    List<CurriculumDetail> findByCurriculumIdAndSemester(@Param("curriculumId") Long curriculumId, @Param("semester") String semester);
    
    @Query("SELECT cd FROM CurriculumDetail cd JOIN FETCH cd.course WHERE cd.curriculum.curriculumID = :curriculumId ORDER BY cd.YearLevel, cd.Semester")
    List<CurriculumDetail> findByCurriculumIdOrderByYearAndSemester(@Param("curriculumId") Long curriculumId);
}