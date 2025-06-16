package com.stasis.stasis.service;

import com.stasis.stasis.model.CurriculumDetail;
import com.stasis.stasis.repository.CurriculumDetailRepository;
import com.stasis.stasis.repository.CurriculumRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CurriculumDetailService {

    @Autowired
    private CurriculumDetailRepository curriculumDetailRepository;

    @Autowired
    private CurriculumRepository curriculumRepository;

    public List<CurriculumDetail> getAllCurriculumDetails() {
        return curriculumDetailRepository.findAll();
    }

    public Optional<CurriculumDetail> getCurriculumDetailById(Long id) {
        return curriculumDetailRepository.findById(id);
    }

    public CurriculumDetail createCurriculumDetail(CurriculumDetail curriculumDetail) {
        return curriculumDetailRepository.save(curriculumDetail);
    }

    public CurriculumDetail updateCurriculumDetail(Long id, CurriculumDetail updatedDetail) {
        return curriculumDetailRepository.findById(id)
            .map(detail -> {
                detail.setCurriculum(updatedDetail.getCurriculum());
                detail.setCourse(updatedDetail.getCourse());
                detail.setSuggestedYearLevel(updatedDetail.getSuggestedYearLevel());
                detail.setSuggestedSemester(updatedDetail.getSuggestedSemester());
                return curriculumDetailRepository.save(detail);
            })
            .orElseThrow(() -> new RuntimeException("Curriculum Detail not found with ID " + id));
    }

    public void deleteCurriculumDetail(Long id) {
        curriculumDetailRepository.deleteById(id);
    }

    public List<CurriculumDetail> getDetailsByCurriculum(Long curriculumId) {
        return curriculumDetailRepository.findByCurriculumId(curriculumId);
    }

    public List<CurriculumDetail> getDetailsByYearLevel(int yearLevel) {
        return curriculumDetailRepository.findBySuggestedYearLevel(yearLevel);
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