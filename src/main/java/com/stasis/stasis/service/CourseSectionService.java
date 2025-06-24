package com.stasis.stasis.service;

import com.stasis.stasis.model.CourseSection;
import com.stasis.stasis.repository.CourseSectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CourseSectionService {

    @Autowired
    private CourseSectionRepository courseSectionRepository;

    public List<CourseSection> getAllSections() {
        return courseSectionRepository.findAll();
    }

    public Optional<CourseSection> getSectionById(Long id) {
        return courseSectionRepository.findById(id);
    }

    public CourseSection createSection(CourseSection section) {
        return courseSectionRepository.save(section);
    }

    public CourseSection updateSection(Long id, CourseSection updatedSection) {
        return courseSectionRepository.findById(id)
            .map(section -> {
                section.setCourse(updatedSection.getCourse());
                section.setFaculty(updatedSection.getFaculty());
                section.setSectionName(updatedSection.getSectionName());
                section.setSemester(updatedSection.getSemester());
                section.setYear(updatedSection.getYear());
                section.setStartTime(updatedSection.getStartTime());
                section.setEndTime(updatedSection.getEndTime());
                section.setDay(updatedSection.getDay());
                section.setStatus(updatedSection.getStatus());
                section.setRoom(updatedSection.getRoom());
                return courseSectionRepository.save(section);
            })
            .orElseThrow(() -> new RuntimeException("Section not found with ID " + id));
    }

    public void deleteSection(Long id) {
        courseSectionRepository.deleteById(id);
    }

    // Additional service methods for the new fields
    public List<CourseSection> getSectionsByStatus(String status) {
        return courseSectionRepository.findByStatus(status);
    }

    public List<CourseSection> getSectionsByDay(String day) {
        return courseSectionRepository.findByDay(day);
    }

    public List<CourseSection> getSectionsBySectionName(String sectionName) {
        return courseSectionRepository.findBySectionName(sectionName);
    }

    public List<CourseSection> getActiveSections() {
        return courseSectionRepository.findByStatus("ACTIVE");
    }

   public List<CourseSection> getSectionsByProgram(Long programId) {
    return courseSectionRepository.findByProgramProgramID(programId);
}

    public CourseSection updateSectionStatus(Long id, String status) {
        return courseSectionRepository.findById(id)
            .map(section -> {
                section.setStatus(status);
                return courseSectionRepository.save(section);
            })
            .orElseThrow(() -> new RuntimeException("Section not found with ID " + id));
    }
}
