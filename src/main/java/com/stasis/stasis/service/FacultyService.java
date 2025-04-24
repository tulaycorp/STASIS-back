package com.stasis.stasis.service;

import com.stasis.stasis.model.Faculty;
import com.stasis.stasis.repository.FacultyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FacultyService {

    @Autowired
    private FacultyRepository facultyRepository;

    public List<Faculty> getAllFaculty() {
        return facultyRepository.findAll();
    }

    public Optional<Faculty> getFacultyById(Long id) {
        return facultyRepository.findById(id);
    }

    public Faculty createFaculty(Faculty faculty) {
        return facultyRepository.save(faculty);
    }

    public Faculty updateFaculty(Long id, Faculty updatedFaculty) {
        return facultyRepository.findById(id)
            .map(faculty -> {
                faculty.setFirstName(updatedFaculty.getFirstName());
                faculty.setLastName(updatedFaculty.getLastName());
                faculty.setEmail(updatedFaculty.getEmail());
                faculty.setStatus(updatedFaculty.getStatus());
                faculty.setProgram(updatedFaculty.getProgram());
                return facultyRepository.save(faculty);
            })
            .orElseThrow(() -> new RuntimeException("Faculty not found with ID " + id));
    }

    public void deleteFaculty(Long id) {
        facultyRepository.deleteById(id);
    }
}
