package com.stasis.stasis.repository;

import com.stasis.stasis.model.AcademicRecord;
import com.stasis.stasis.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AcademicRecordRepository extends JpaRepository<AcademicRecord, Long> {
    Optional<AcademicRecord> findByStudent(Student student);
}
