package com.stasis.stasis.controller;

import com.stasis.stasis.model.Advisor;
import com.stasis.stasis.service.AdvisorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/advisors")
public class AdvisorController {

    private final AdvisorService advisorService;
    @Autowired
    public AdvisorController(AdvisorService advisorService) {
        this.advisorService = advisorService;
    }

    @PostMapping
    public ResponseEntity<Advisor> createAdvisor(@RequestBody Advisor advisor) {
        return ResponseEntity.ok(advisorService.createAdvisor(advisor));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Advisor> getAdvisorById(@PathVariable Long id) {
        return advisorService.getAdvisorById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Advisor>> getAllAdvisors() {
        return ResponseEntity.ok(advisorService.getAllAdvisors());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Advisor> updateAdvisor(@PathVariable Long id, @RequestBody Advisor advisor) {
        advisor.setAdvisorID(id);
        return ResponseEntity.ok(advisorService.updateAdvisor(advisor));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAdvisor(@PathVariable Long id) {
        advisorService.deleteAdvisor(id);
        return ResponseEntity.noContent().build();
    }
}