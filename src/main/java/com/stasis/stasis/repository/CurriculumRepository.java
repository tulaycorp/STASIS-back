package com.stasis.stasis.repository;

import com.stasis.stasis.model.Curriculum;
import com.stasis.stasis.model.Program;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CurriculumRepository extends JpaRepository<Curriculum, Long> {
    
    List<Curriculum> findByProgram(Program program);
    
    @Query("SELECT c FROM Curriculum c WHERE c.program.programID = :programId")
    List<Curriculum> findByProgramId(@Param("programId") Long programId);
    
    List<Curriculum> findByStatus(String status);
    
    @Query("SELECT c FROM Curriculum c WHERE c.status = 'Active'")
    List<Curriculum> findActiveCurriculums();
    
    @Query("SELECT c FROM Curriculum c WHERE c.program.programID = :programId AND c.status = 'Active'")
    List<Curriculum> findActiveCurriculumsByProgram(@Param("programId") Long programId);
    
    @Query("SELECT c FROM Curriculum c WHERE c.curriculumName LIKE %:name%")
    List<Curriculum> findByCurriculumNameContaining(@Param("name") String name);
    
    @Query("SELECT c FROM Curriculum c WHERE c.curriculumCode LIKE %:code%")
    List<Curriculum> findByCurriculumCodeContaining(@Param("code") String code);
    
    List<Curriculum> findByAcademicYear(String academicYear);
}