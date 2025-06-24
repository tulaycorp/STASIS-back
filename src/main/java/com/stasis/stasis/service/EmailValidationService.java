package com.stasis.stasis.service;

import com.stasis.stasis.repository.StudentRepository;
import com.stasis.stasis.repository.FacultyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EmailValidationService {
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private FacultyRepository facultyRepository;
    
    public boolean isEmailUnique(String email) {
        return !studentRepository.findByEmail(email).isPresent() && 
               !facultyRepository.findByEmail(email).isPresent();
    }
    
    public boolean isEmailUniqueForStudent(String email, Long excludeStudentId) {
        // Check if email exists in faculty
        if (facultyRepository.findByEmail(email).isPresent()) {
            return false;
        }
        
        // Check if email exists in other students
        return studentRepository.findByEmail(email)
            .map(student -> student.getId().equals(excludeStudentId))
            .orElse(true);
    }
    
    public boolean isEmailUniqueForFaculty(String email, Long excludeFacultyId) {
        // Check if email exists in students
        if (studentRepository.findByEmail(email).isPresent()) {
            return false;
        }
        
        // Check if email exists in other faculty
        return facultyRepository.findByEmail(email)
            .map(faculty -> faculty.getFacultyID().equals(excludeFacultyId))
            .orElse(true);
    }
}