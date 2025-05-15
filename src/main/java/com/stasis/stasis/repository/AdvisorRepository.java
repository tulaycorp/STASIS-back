package com.stasis.stasis.repository;

import com.stasis.stasis.model.Advisor;
import com.stasis.stasis.model.Faculty;
import com.stasis.stasis.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdvisorRepository extends JpaRepository<Advisor, Long> {
    List<Advisor> findByFaculty(Faculty faculty);
    List<Advisor> findByStudent(Student student);
}