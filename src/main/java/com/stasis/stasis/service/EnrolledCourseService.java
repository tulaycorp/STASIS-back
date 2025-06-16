package com.stasis.stasis.service;

import com.stasis.stasis.model.EnrolledCourse;
import com.stasis.stasis.model.SemesterEnrollment;
import com.stasis.stasis.model.CourseSection;
import com.stasis.stasis.repository.EnrolledCourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EnrolledCourseService {

    @Autowired
    private EnrolledCourseRepository enrolledCourseRepository;

    public List<EnrolledCourse> getAllEnrolledCourses() {
        return enrolledCourseRepository.findAll();
    }

    public Optional<EnrolledCourse> getEnrolledCourseById(Long id) {
        return enrolledCourseRepository.findById(id);
    }

    public List<EnrolledCourse> getEnrolledCoursesBySemesterEnrollment(SemesterEnrollment semesterEnrollment) {
        return enrolledCourseRepository.findBySemesterEnrollment(semesterEnrollment);
    }

    public EnrolledCourse createEnrolledCourse(EnrolledCourse enrolledCourse) {
        return enrolledCourseRepository.save(enrolledCourse);
    }

    public EnrolledCourse updateEnrolledCourse(Long id, EnrolledCourse updatedEnrolledCourse) {
        return enrolledCourseRepository.findById(id)
            .map(enrolledCourse -> {
                enrolledCourse.setSemesterEnrollment(updatedEnrolledCourse.getSemesterEnrollment());
                enrolledCourse.setSection(updatedEnrolledCourse.getSection());
                enrolledCourse.setStatus(updatedEnrolledCourse.getStatus());
                enrolledCourse.setGrade(updatedEnrolledCourse.getGrade());
                return enrolledCourseRepository.save(enrolledCourse);
            })
            .orElseThrow(() -> new RuntimeException("Enrolled Course not found with ID " + id));
    }

    public void deleteEnrolledCourse(Long id) {
        enrolledCourseRepository.deleteById(id);
    }

    public boolean enrollStudentInCourseSection(SemesterEnrollment semesterEnrollment, CourseSection section, String status) {
        try {
            EnrolledCourse enrolledCourse = EnrolledCourse.builder()
                .semesterEnrollment(semesterEnrollment)
                .section(section)
                .status(status)
                .build();
            enrolledCourseRepository.save(enrolledCourse);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean updateEnrollmentStatus(Long enrolledCourseId, String newStatus) {
        Optional<EnrolledCourse> enrolledCourseOpt = enrolledCourseRepository.findById(enrolledCourseId);
        if (enrolledCourseOpt.isPresent()) {
            EnrolledCourse enrolledCourse = enrolledCourseOpt.get();
            enrolledCourse.setStatus(newStatus);
            enrolledCourseRepository.save(enrolledCourse);
            return true;
        }
        return false;
    }
}
