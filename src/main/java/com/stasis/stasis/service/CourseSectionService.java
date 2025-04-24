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
                section.setSemester(updatedSection.getSemester());
                section.setYear(updatedSection.getYear());
                section.setSchedule(updatedSection.getSchedule());
                section.setRoom(updatedSection.getRoom());
                return courseSectionRepository.save(section);
            })
            .orElseThrow(() -> new RuntimeException("Section not found with ID " + id));
    }

    public void deleteSection(Long id) {
        courseSectionRepository.deleteById(id);
    }
}
