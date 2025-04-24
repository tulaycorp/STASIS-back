package com.stasis.stasis.repository;

import com.stasis.stasis.model.AcademicRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AcademicRecordRepository extends JpaRepository<AcademicRecord, Long> {
}