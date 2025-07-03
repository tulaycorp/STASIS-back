package com.stasis.stasis.service;

import com.stasis.stasis.model.CourseSection;
import com.stasis.stasis.model.Schedule;
import com.stasis.stasis.repository.CourseSectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CourseSectionService {

    @Autowired
    private CourseSectionRepository courseSectionRepository;
    
    @Autowired
    private ScheduleService scheduleService;

    public List<CourseSection> getAllSections() {
        return courseSectionRepository.findAll();
    }

    public Optional<CourseSection> getSectionById(Long id) {
        return courseSectionRepository.findById(id);
    }

    public CourseSection createSection(CourseSection section) {
        List<Schedule> schedules = section.getSchedules();
        if (schedules != null && !schedules.isEmpty()) {
            // Save section first without schedules, then add schedules
            section.setSchedules(null);
            CourseSection savedSection = courseSectionRepository.save(section);
            
            // Now create the schedules for this section
            try {
                List<Schedule> savedSchedules = new java.util.ArrayList<>();
                for (Schedule schedule : schedules) {
                    Schedule savedSchedule = scheduleService.createSchedule(schedule, savedSection.getSectionID());
                    savedSchedules.add(savedSchedule);
                }
                savedSection.setSchedules(savedSchedules);
                return courseSectionRepository.save(savedSection);
            } catch (Exception e) {
                // If schedule creation fails, delete the section to maintain consistency
                courseSectionRepository.delete(savedSection);
                throw new RuntimeException("Failed to create schedules: " + e.getMessage());
            }
        }
        return courseSectionRepository.save(section);
    }

    public CourseSection updateSection(Long id, CourseSection updatedSection) {
        return courseSectionRepository.findById(id)
            .map(section -> {
                // Remove course assignment from section level since courses are now managed per schedule
                section.setFaculty(updatedSection.getFaculty());
                section.setSectionName(updatedSection.getSectionName());
                section.setSemester(updatedSection.getSemester());
                section.setYear(updatedSection.getYear());
                section.setProgram(updatedSection.getProgram());
                
                // Update the schedules
                if (updatedSection.getSchedules() != null) {
                    // Delete existing schedules
                    if (section.getSchedules() != null) {
                        for (Schedule schedule : section.getSchedules()) {
                            scheduleService.deleteSchedule(schedule.getScheduleID());
                        }
                    }
                    
                    // Create new schedules
                    List<Schedule> newSchedules = new java.util.ArrayList<>();
                    for (Schedule schedule : updatedSection.getSchedules()) {
                        Schedule savedSchedule = scheduleService.createSchedule(schedule, section.getSectionID());
                        newSchedules.add(savedSchedule);
                    }
                    section.setSchedules(newSchedules);
                } else if (section.getSchedules() != null) {
                    // If schedules were removed, delete existing ones
                    for (Schedule schedule : section.getSchedules()) {
                        scheduleService.deleteSchedule(schedule.getScheduleID());
                    }
                    section.setSchedules(null);
                }
                
                return courseSectionRepository.save(section);
            })
            .orElseThrow(() -> new RuntimeException("Section not found with ID " + id));
    }

    public void deleteSection(Long id) {
        courseSectionRepository.deleteById(id);
    }

    public List<CourseSection> getSectionsBySectionName(String sectionName) {
        return courseSectionRepository.findBySectionName(sectionName);
    }

    public List<CourseSection> getActiveSections() {
        return courseSectionRepository.findByScheduleStatus("ACTIVE");
    }

    public List<CourseSection> getSectionsByProgram(Long programId) {
        return courseSectionRepository.findByProgramProgramID(programId);
    }

    public CourseSection updateSectionStatus(Long id, String status) {
        return courseSectionRepository.findById(id)
            .map(section -> {
                if (section.getSchedules() != null && !section.getSchedules().isEmpty()) {
                    for (Schedule schedule : section.getSchedules()) {
                        schedule.setStatus(status);
                        // Persist status update without creating duplicate schedule
                        scheduleService.updateScheduleStatus(schedule.getScheduleID(), status);
                    }
                }
                return courseSectionRepository.save(section);
            })
            .orElseThrow(() -> new RuntimeException("Section not found with ID " + id));
    }

    public List<CourseSection> getSectionsByFaculty(Long facultyId) {
        return courseSectionRepository.findByFaculty_FacultyID(facultyId);
    }
}
