package com.stasis.stasis.service;

import com.stasis.stasis.model.Advisor;
import com.stasis.stasis.model.Faculty;
import com.stasis.stasis.model.Student;
import com.stasis.stasis.repository.AdvisorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AdvisorService {
    
    private final AdvisorRepository advisorRepository;

    @Autowired
    public AdvisorService(AdvisorRepository advisorRepository) {
        this.advisorRepository = advisorRepository;
    }

    public Advisor createAdvisor(Advisor advisor) {
        return advisorRepository.save(advisor);
    }

    public Optional<Advisor> getAdvisorById(Long id) {
        return advisorRepository.findById(id);
    }

    public List<Advisor> getAllAdvisors() {
        return advisorRepository.findAll();
    }

    public List<Advisor> getAdvisorsByFaculty(Faculty faculty) {
        return advisorRepository.findByFaculty(faculty);
    }

    public List<Advisor> getAdvisorsByStudent(Student student) {
        return advisorRepository.findByStudent(student);
    }

    public Advisor updateAdvisor(Advisor advisor) {
        return advisorRepository.save(advisor);
    }

    public void deleteAdvisor(Long id) {
        advisorRepository.deleteById(id);
    }
}