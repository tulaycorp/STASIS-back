package com.stasis.stasis.service;

import com.stasis.stasis.model.SemesterEnrollment;
import com.stasis.stasis.model.Student;
import com.stasis.stasis.model.EnrolledCourse;
import com.stasis.stasis.repository.SemesterEnrollmentRepository;
import com.stasis.stasis.repository.StudentRepository;
import com.stasis.stasis.repository.EnrolledCourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class SemesterEnrollmentService {

    @Autowired
    private SemesterEnrollmentRepository semesterEnrollmentRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private EnrolledCourseRepository enrolledCourseRepository;

    public List<SemesterEnrollment> getAllSemesterEnrollments() {
        return semesterEnrollmentRepository.findAll();
    }

    public Optional<SemesterEnrollment> getSemesterEnrollmentById(Long id) {
        return semesterEnrollmentRepository.findById(id);
    }

    public SemesterEnrollment createSemesterEnrollment(SemesterEnrollment semesterEnrollment) {
        semesterEnrollment.setDateEnrolled(LocalDate.now());
        return semesterEnrollmentRepository.save(semesterEnrollment);
    }

    public SemesterEnrollment updateSemesterEnrollment(Long id, SemesterEnrollment updatedEnrollment) {
        return semesterEnrollmentRepository.findById(id)
            .map(enrollment -> {
                enrollment.setStudent(updatedEnrollment.getStudent());
                enrollment.setSemester(updatedEnrollment.getSemester());
                enrollment.setAcademicYear(updatedEnrollment.getAcademicYear());
                enrollment.setStatus(updatedEnrollment.getStatus());
                enrollment.setTotalCredits(updatedEnrollment.getTotalCredits());
                return semesterEnrollmentRepository.save(enrollment);
            })
            .orElseThrow(() -> new RuntimeException("Semester Enrollment not found with ID " + id));
    }

    public void deleteSemesterEnrollment(Long id) {
        semesterEnrollmentRepository.deleteById(id);
    }

    public List<SemesterEnrollment> getEnrollmentsByStudent(Long studentId) {
        return semesterEnrollmentRepository.findByStudent_Id(studentId); // Fixed method name
    }

    public List<SemesterEnrollment> getEnrollmentsBySemester(String semester, String academicYear) {
        return semesterEnrollmentRepository.findBySemesterAndAcademicYear(semester, academicYear);
    }

    public List<SemesterEnrollment> getCurrentEnrollments() {
        return semesterEnrollmentRepository.findActiveEnrollments();
    }

    public SemesterEnrollment updateTotalCredits(Long id) {
        return semesterEnrollmentRepository.findById(id)
            .map(enrollment -> {
                List<EnrolledCourse> enrolledCourses = enrolledCourseRepository.findBySemesterEnrollment(enrollment);
                int totalCredits = enrolledCourses.stream()
                    .mapToInt(ec -> ec.getSection().getCourse().getCreditUnits())
                    .sum();
                enrollment.setTotalCredits(totalCredits);
                return semesterEnrollmentRepository.save(enrollment);
            })
            .orElseThrow(() -> new RuntimeException("Semester Enrollment not found with ID " + id));
    }

    public Optional<SemesterEnrollment> findByStudentAndSemester(Long studentId, String semester, String academicYear) {
        return semesterEnrollmentRepository.findByStudent_IdAndSemesterAndAcademicYear(studentId, semester, academicYear); // Fixed method name
    }
}