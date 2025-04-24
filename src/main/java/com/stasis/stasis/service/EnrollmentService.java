package com.stasis.stasis.service;

import com.stasis.stasis.model.Enrollment;
import com.stasis.stasis.repository.EnrollmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EnrollmentService {

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    public List<Enrollment> getAllEnrollments() {
        return enrollmentRepository.findAll();
    }

    public Optional<Enrollment> getEnrollmentById(Long id) {
        return enrollmentRepository.findById(id);
    }

    public Enrollment createEnrollment(Enrollment enrollment) {
        return enrollmentRepository.save(enrollment);
    }

    public Enrollment updateEnrollment(Long id, Enrollment updatedEnrollment) {
        return enrollmentRepository.findById(id)
            .map(enrollment -> {
                enrollment.setStudent(updatedEnrollment.getStudent());
                enrollment.setSection(updatedEnrollment.getSection());
                enrollment.setEnrollmentDate(updatedEnrollment.getEnrollmentDate());
                enrollment.setStatus(updatedEnrollment.getStatus());
                return enrollmentRepository.save(enrollment);
            })
            .orElseThrow(() -> new RuntimeException("Enrollment not found with ID " + id));
    }

    public void deleteEnrollment(Long id) {
        enrollmentRepository.deleteById(id);
    }
}
