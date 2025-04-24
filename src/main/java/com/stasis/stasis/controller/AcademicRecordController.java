package com.stasis.stasis.controller;

import com.stasis.stasis.model.AcademicRecord;
import com.stasis.stasis.service.AcademicRecordService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/api/academic-records")
public class AcademicRecordController {

    private AcademicRecordService academicRecordService;

    @GetMapping
    public List<AcademicRecord> getAllRecords() {
        return academicRecordService.getAllRecords();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AcademicRecord> getRecordById(@PathVariable Long id) {
        return academicRecordService.getRecordById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public AcademicRecord createRecord(@RequestBody AcademicRecord record) {
        return academicRecordService.createRecord(record);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AcademicRecord> updateRecord(@PathVariable Long id, @RequestBody AcademicRecord record) {
        try {
            return ResponseEntity.ok(academicRecordService.updateRecord(id, record));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable Long id) {
        academicRecordService.deleteRecord(id);
        return ResponseEntity.noContent().build();
    }
}
