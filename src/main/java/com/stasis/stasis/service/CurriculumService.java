package com.stasis.stasis.service;

import com.stasis.stasis.model.Curriculum;
import com.stasis.stasis.repository.CurriculumRepository;
import com.stasis.stasis.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class CurriculumService {

    @Autowired
    private CurriculumRepository curriculumRepository;
    
    @Autowired
    private StudentRepository studentRepository;


    public List<Curriculum> getAllCurriculums() {
        return curriculumRepository.findAll();
    }

    public Optional<Curriculum> getCurriculumById(Long id) {
        return curriculumRepository.findById(id);
    }

    public Curriculum createCurriculum(Curriculum curriculum) {
        curriculum.setLastUpdated(LocalDate.now());
        if (curriculum.getEffectiveStartDate() == null) {
            curriculum.setEffectiveStartDate(LocalDate.now());
        }
        if (curriculum.getStatus() == null) {
            curriculum.setStatus("Draft");
        }
        return curriculumRepository.save(curriculum);
    }

    public Curriculum updateCurriculum(Long id, Curriculum updatedCurriculum) {
        return curriculumRepository.findById(id)
            .map(curriculum -> {
                curriculum.setCurriculumName(updatedCurriculum.getCurriculumName());
                curriculum.setCurriculumCode(updatedCurriculum.getCurriculumCode());
                curriculum.setAcademicYear(updatedCurriculum.getAcademicYear());
                curriculum.setDescription(updatedCurriculum.getDescription());
                curriculum.setEffectiveStartDate(updatedCurriculum.getEffectiveStartDate());
                curriculum.setProgram(updatedCurriculum.getProgram());
                curriculum.setStatus(updatedCurriculum.getStatus());
                curriculum.setLastUpdated(LocalDate.now());
                
                // Update curriculum details if provided
                if (updatedCurriculum.getCurriculumDetails() != null) {
                    curriculum.getCurriculumDetails().clear();
                    curriculum.getCurriculumDetails().addAll(updatedCurriculum.getCurriculumDetails());
                    // Set the curriculum reference in each detail
                    curriculum.getCurriculumDetails().forEach(detail -> detail.setCurriculum(curriculum));
                }
                return curriculumRepository.save(curriculum);
            })
            .orElseThrow(() -> new RuntimeException("Curriculum not found with ID " + id));
    }

    public void deleteCurriculum(Long id) {
        curriculumRepository.deleteById(id);
    }

    public List<Curriculum> getCurriculumsByProgram(Long programId) {
        return curriculumRepository.findByProgramId(programId);
    }

    public List<Curriculum> getActiveCurriculums() {
        return curriculumRepository.findByStatus("Active");
    }

    public Curriculum activateCurriculum(Long id) {
        return curriculumRepository.findById(id)
            .map(curriculum -> {
                curriculum.setStatus("Active");
                curriculum.setLastUpdated(LocalDate.now());
                return curriculumRepository.save(curriculum);
            })
            .orElseThrow(() -> new RuntimeException("Curriculum not found with ID " + id));
    }

    public Curriculum deactivateCurriculum(Long id) {
        return curriculumRepository.findById(id)
            .map(curriculum -> {
                curriculum.setStatus("Inactive");
                curriculum.setLastUpdated(LocalDate.now());
                return curriculumRepository.save(curriculum);
            })
            .orElseThrow(() -> new RuntimeException("Curriculum not found with ID " + id));
    }

    public List<Curriculum> searchCurriculumsByName(String name) {
        return curriculumRepository.findByCurriculumNameContaining(name);
    }
    
    public Long getStudentCountByCurriculum(Long curriculumId) {
        return studentRepository.countStudentsByCurriculumId(curriculumId);
    }
}