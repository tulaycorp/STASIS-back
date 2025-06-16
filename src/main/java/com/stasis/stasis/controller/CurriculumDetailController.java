package com.stasis.stasis.controller;

import com.stasis.stasis.model.CurriculumDetail;
import com.stasis.stasis.service.CurriculumDetailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/curriculum-details")
@CrossOrigin(origins = "http://localhost:3000")
public class CurriculumDetailController {

    @Autowired
    private CurriculumDetailService curriculumDetailService;

    @GetMapping
    public List<CurriculumDetail> getAllCurriculumDetails() {
        return curriculumDetailService.getAllCurriculumDetails();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CurriculumDetail> getCurriculumDetailById(@PathVariable Long id) {
        Optional<CurriculumDetail> detail = curriculumDetailService.getCurriculumDetailById(id);
        return detail.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public CurriculumDetail createCurriculumDetail(@RequestBody CurriculumDetail curriculumDetail) {
        return curriculumDetailService.createCurriculumDetail(curriculumDetail);
    }

    @PutMapping("/{id}")
    public CurriculumDetail updateCurriculumDetail(@PathVariable Long id, @RequestBody CurriculumDetail curriculumDetail) {
        return curriculumDetailService.updateCurriculumDetail(id, curriculumDetail);
    }

    @DeleteMapping("/{id}")
    public void deleteCurriculumDetail(@PathVariable Long id) {
        curriculumDetailService.deleteCurriculumDetail(id);
    }

    @GetMapping("/curriculum/{curriculumId}")
    public List<CurriculumDetail> getDetailsByCurriculum(@PathVariable Long curriculumId) {
        return curriculumDetailService.getDetailsByCurriculum(curriculumId);
    }

    @GetMapping("/year/{yearLevel}")
    public List<CurriculumDetail> getDetailsByYearLevel(@PathVariable int yearLevel) {
        return curriculumDetailService.getDetailsByYearLevel(yearLevel);
    }

    @GetMapping("/curriculum/{curriculumId}/year/{yearLevel}")
    public List<CurriculumDetail> getDetailsByCurriculumAndYear(@PathVariable Long curriculumId, @PathVariable int yearLevel) {
        return curriculumDetailService.getDetailsByCurriculumAndYear(curriculumId, yearLevel);
    }
}