package com.stasis.stasis.service;

import com.stasis.stasis.model.CurriculumDetail;
import com.stasis.stasis.repository.CurriculumDetailRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CurriculumDetailService {

    @Autowired
    private CurriculumDetailRepository curriculumDetailRepository;

    public List<CurriculumDetail> getAllCurriculumDetails() {
        return curriculumDetailRepository.findAll();
    }

    public Optional<CurriculumDetail> getCurriculumDetailById(Long id) {
        return curriculumDetailRepository.findById(id);
    }

    public CurriculumDetail createCurriculumDetail(CurriculumDetail curriculumDetail) {
        return curriculumDetailRepository.save(curriculumDetail);
    }

    public CurriculumDetail updateCurriculumDetail(Long id, CurriculumDetail curriculumDetailUpdate) {
        return curriculumDetailRepository.findById(id)
                .map(detail -> {
                    detail.setCurriculum(curriculumDetailUpdate.getCurriculum());
                    detail.setCourse(curriculumDetailUpdate.getCourse());
                    detail.setYearLevel(curriculumDetailUpdate.getYearLevel());
                    detail.setSemester(curriculumDetailUpdate.getSemester());
                    return curriculumDetailRepository.save(detail);
                })
                .orElseThrow(() -> new RuntimeException("CurriculumDetail not found with id " + id));
    }

    public void deleteCurriculumDetail(Long id) {
        curriculumDetailRepository.deleteById(id);
    }

    public List<CurriculumDetail> getDetailsByCurriculum(Long curriculumId) {
        return curriculumDetailRepository.findByCurriculumId(curriculumId);
    }

    public List<CurriculumDetail> getDetailsByYearLevel(int yearLevel) {
        return curriculumDetailRepository.findByYearLevel(yearLevel);
    }

    public List<CurriculumDetail> getDetailsByCurriculumAndYear(Long curriculumId, int yearLevel) {
        return curriculumDetailRepository.findByCurriculumIdAndYearLevel(curriculumId, yearLevel);
    }

    public List<CurriculumDetail> getDetailsByCurriculumAndSemester(Long curriculumId, String semester) {
        return curriculumDetailRepository.findByCurriculumIdAndSemester(curriculumId, semester);
    }

    public List<CurriculumDetail> getDetailsByCurriculumOrdered(Long curriculumId) {
        return curriculumDetailRepository.findByCurriculumIdOrderByYearAndSemester(curriculumId);
    }
}