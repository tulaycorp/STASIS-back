package com.stasis.stasis.service;

import com.stasis.stasis.model.AcademicRecord;
import com.stasis.stasis.model.Student;
import com.stasis.stasis.repository.AcademicRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AcademicRecordService {

    @Autowired
    private AcademicRecordRepository academicRecordRepository;

    public List<AcademicRecord> getAllRecords() {
        return academicRecordRepository.findAll();
    }

    public Optional<AcademicRecord> getRecordById(Long id) {
        return academicRecordRepository.findById(id);
    }

    public Optional<AcademicRecord> getRecordByStudent(Student student) {
        return academicRecordRepository.findByStudent(student);
    }

    public AcademicRecord createRecord(AcademicRecord record) {
        return academicRecordRepository.save(record);
    }

    public AcademicRecord updateRecord(Long id, AcademicRecord updatedRecord) {
        return academicRecordRepository.findById(id)
            .map(record -> {
                record.setStudent(updatedRecord.getStudent());
                record.setGA(updatedRecord.getGA());
                record.setTotalCredits(updatedRecord.getTotalCredits());
                record.setAcademicStanding(updatedRecord.getAcademicStanding());
                return academicRecordRepository.save(record);
            })
            .orElseThrow(() -> new RuntimeException("Record not found with ID " + id));
    }

    public void deleteRecord(Long id) {
        academicRecordRepository.deleteById(id);
    }

    public void deleteRecordByStudent(Student student) {
        Optional<AcademicRecord> record = academicRecordRepository.findByStudent(student);
        record.ifPresent(academicRecordRepository::delete);
    }
}
