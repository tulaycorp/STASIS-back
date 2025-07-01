package com.stasis.stasis.controller;

import com.stasis.stasis.model.Curriculum;
import com.stasis.stasis.service.CurriculumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/curriculums")
@CrossOrigin(origins = "http://localhost:3000")
public class CurriculumController {

    @Autowired
    private CurriculumService curriculumService;

    @GetMapping
    public List<Curriculum> getAllCurriculums() {
        return curriculumService.getAllCurriculums();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Curriculum> getCurriculumById(@PathVariable Long id) {
        Optional<Curriculum> curriculum = curriculumService.getCurriculumById(id);
        return curriculum.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Curriculum createCurriculum(@RequestBody Curriculum curriculum) {
        return curriculumService.createCurriculum(curriculum);
    }

    @PutMapping("/{id}")
    public Curriculum updateCurriculum(@PathVariable Long id, @RequestBody Curriculum curriculum) {
        return curriculumService.updateCurriculum(id, curriculum);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCurriculum(@PathVariable Long id) {
        curriculumService.deleteCurriculum(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/program/{programId}")
    public List<Curriculum> getCurriculumsByProgram(@PathVariable Long programId) {
        return curriculumService.getCurriculumsByProgram(programId);
    }

    @GetMapping("/active")
    public List<Curriculum> getActiveCurriculums() {
        return curriculumService.getActiveCurriculums();
    }

    @PutMapping("/{id}/activate")
    public Curriculum activateCurriculum(@PathVariable Long id) {
        return curriculumService.activateCurriculum(id);
    }

    @PutMapping("/{id}/deactivate")
    public Curriculum deactivateCurriculum(@PathVariable Long id) {
        return curriculumService.deactivateCurriculum(id);
    }

    @GetMapping("/search")
    public List<Curriculum> searchCurriculums(@RequestParam String name) {
        return curriculumService.searchCurriculumsByName(name);
    }

    @GetMapping("/{id}/student-count")
    public ResponseEntity<Long> getStudentCount(@PathVariable Long id) {
        Long count = curriculumService.getStudentCountByCurriculum(id);
        return ResponseEntity.ok(count);
    }
}