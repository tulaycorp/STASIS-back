package com.stasis.stasis.service;

import com.stasis.stasis.model.Student;
import com.stasis.stasis.repository.StudentRepository;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

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

    public Student updateStudent(Long id, Student updated) {
        return studentRepository.findById(id)
                .map(student -> {
                    student.setFirstName(updated.getFirstName());
                    student.setLastName(updated.getLastName());
                    student.setEmail(updated.getEmail());
                    student.setDateOfBirth(updated.getDateOfBirth());
                    // student.setProgram(updated.getProgram());
                    return studentRepository.save(student);
                })
                .orElse(null);
    }

    public void deleteStudent(Long id) {
        studentRepository.deleteById(id);
    }
}