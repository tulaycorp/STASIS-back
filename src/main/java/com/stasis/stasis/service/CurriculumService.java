package com.stasis.stasis.service;

import com.stasis.stasis.model.Curriculum;
import com.stasis.stasis.model.Program;
import com.stasis.stasis.repository.CurriculumRepository;
import com.stasis.stasis.repository.ProgramRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CurriculumService {

    @Autowired
    private CurriculumRepository curriculumRepository;

    @Autowired
    private ProgramRepository programRepository;

    public List<Curriculum> getAllCurriculums() {
        return curriculumRepository.findAll();
    }

    public Optional<Curriculum> getCurriculumById(Long id) {
        return curriculumRepository.findById(id);
    }

    public Curriculum createCurriculum(Curriculum curriculum) {
        return curriculumRepository.save(curriculum);
    }

    public Curriculum updateCurriculum(Long id, Curriculum updatedCurriculum) {
        return curriculumRepository.findById(id)
            .map(curriculum -> {
                curriculum.setCurriculumName(updatedCurriculum.getCurriculumName());
                curriculum.setEffectiveStartDate(updatedCurriculum.getEffectiveStartDate());
                curriculum.setProgram(updatedCurriculum.getProgram());
                curriculum.setActive(updatedCurriculum.isActive());
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
        return curriculumRepository.findByIsActive(true);
    }

    public Curriculum activateCurriculum(Long id) {
        return curriculumRepository.findById(id)
            .map(curriculum -> {
                curriculum.setActive(true);
                return curriculumRepository.save(curriculum);
            })
            .orElseThrow(() -> new RuntimeException("Curriculum not found with ID " + id));
    }

    public Curriculum deactivateCurriculum(Long id) {
        return curriculumRepository.findById(id)
            .map(curriculum -> {
                curriculum.setActive(false);
                return curriculumRepository.save(curriculum);
            })
            .orElseThrow(() -> new RuntimeException("Curriculum not found with ID " + id));
    }

    public List<Curriculum> searchCurriculumsByName(String name) {
        return curriculumRepository.findByCurriculumNameContaining(name);
    }
}