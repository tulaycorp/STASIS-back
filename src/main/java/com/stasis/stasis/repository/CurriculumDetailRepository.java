package com.stasis.stasis.repository;

import com.stasis.stasis.model.CurriculumDetail;
import com.stasis.stasis.model.Curriculum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CurriculumDetailRepository extends JpaRepository<CurriculumDetail, Long> {
    
    List<CurriculumDetail> findByCurriculum(Curriculum curriculum);
    
    @Query("SELECT cd FROM CurriculumDetail cd WHERE cd.curriculum.curriculumID = :curriculumId")
    List<CurriculumDetail> findByCurriculumId(@Param("curriculumId") Long curriculumId);
    
    List<CurriculumDetail> findBySuggestedYearLevel(int yearLevel);
    
    @Query("SELECT cd FROM CurriculumDetail cd WHERE cd.curriculum.curriculumID = :curriculumId AND cd.suggestedYearLevel = :yearLevel")
    List<CurriculumDetail> findByCurriculumIdAndYearLevel(@Param("curriculumId") Long curriculumId, @Param("yearLevel") int yearLevel);
    
    @Query("SELECT cd FROM CurriculumDetail cd WHERE cd.curriculum.curriculumID = :curriculumId AND cd.suggestedSemester = :semester")
    List<CurriculumDetail> findByCurriculumIdAndSemester(@Param("curriculumId") Long curriculumId, @Param("semester") String semester);
    
    @Query("SELECT cd FROM CurriculumDetail cd WHERE cd.curriculum.curriculumID = :curriculumId ORDER BY cd.suggestedYearLevel, cd.suggestedSemester")
    List<CurriculumDetail> findByCurriculumIdOrderByYearAndSemester(@Param("curriculumId") Long curriculumId);
}