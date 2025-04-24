package com.stasis.stasis.service;

import com.stasis.stasis.model.Grade;
import com.stasis.stasis.repository.GradeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GradeService {

    @Autowired
    private GradeRepository gradeRepository;

    public List<Grade> getAllGrades() {
        return gradeRepository.findAll();
    }

    public Optional<Grade> getGradeById(Long id) {
        return gradeRepository.findById(id);
    }

    public Grade createGrade(Grade grade) {
        return gradeRepository.save(grade);
    }

    public Grade updateGrade(Long id, Grade updatedGrade) {
        return gradeRepository.findById(id)
            .map(grade -> {
                grade.setEnrollment(updatedGrade.getEnrollment());
                grade.setGradeValue(updatedGrade.getGradeValue());
                grade.setGradeDate(updatedGrade.getGradeDate());
                return gradeRepository.save(grade);
            })
            .orElseThrow(() -> new RuntimeException("Grade not found with ID " + id));
    }

    public void deleteGrade(Long id) {
        gradeRepository.deleteById(id);
    }
}
