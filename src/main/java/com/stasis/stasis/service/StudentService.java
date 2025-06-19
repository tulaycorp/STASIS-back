package com.stasis.stasis.service;

import com.stasis.stasis.model.Student;
import com.stasis.stasis.repository.StudentRepository;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }

    public Student createStudent(Student student) {
        return studentRepository.save(student);
    }

    public Student updateStudent(Long id, Student studentDetails) {
        return studentRepository.findById(id)
            .map(student -> {
                student.setFirstName(studentDetails.getFirstName());
                student.setLastName(studentDetails.getLastName());
                student.setEmail(studentDetails.getEmail());
                student.setDateOfBirth(studentDetails.getDateOfBirth());
                student.setYear_level(studentDetails.getYear_level());
                if (studentDetails.getProgram() != null) {
                    student.setProgram(studentDetails.getProgram());
                }
                return studentRepository.save(student);
            })
            .orElseThrow(() -> new RuntimeException("Student not found with id: " + id));
    }

    public void deleteStudent(Long id) {
        studentRepository.deleteById(id);
    }

    public Student promoteStudent(Long id) {
        return studentRepository.findById(id)
            .map(student -> {
                if (student.getYear_level() < 4) {
                    student.setYear_level(student.getYear_level() + 1);
                }
                return studentRepository.save(student);
            })
            .orElseThrow(() -> new RuntimeException("Student not found with id: " + id));
    }
}