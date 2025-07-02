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
        Schedule schedule = section.getSchedule();
        if (schedule != null) {
            // Save schedule first with null courseSectionId, then update it after section is saved
            section.setSchedule(null);
            CourseSection savedSection = courseSectionRepository.save(section);
            
            // Now create the schedule with the section's ID
            try {
                Schedule savedSchedule = scheduleService.createSchedule(schedule, savedSection.getSectionID());
                savedSection.setSchedule(savedSchedule);
                return courseSectionRepository.save(savedSection);
            } catch (Exception e) {
                // If schedule creation fails, delete the section to maintain consistency
                courseSectionRepository.delete(savedSection);
                throw new RuntimeException("Failed to create schedule: " + e.getMessage());
            }
        }
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
                section.setProgram(updatedSection.getProgram());
                
                // Update the schedule
                if (updatedSection.getSchedule() != null) {
                    if (section.getSchedule() != null) {
                        // Update existing schedule preserving its ID instead of creating a new one
                        Schedule schedule = section.getSchedule();
                        schedule.setStartTime(updatedSection.getSchedule().getStartTime());
                        schedule.setEndTime(updatedSection.getSchedule().getEndTime());
                        schedule.setDay(updatedSection.getSchedule().getDay());
                        schedule.setStatus(updatedSection.getSchedule().getStatus());
                        schedule.setRoom(updatedSection.getSchedule().getRoom());
                        // Persist the changes without generating a new schedule record
                        scheduleService.updateSchedule(schedule.getScheduleID(), schedule);
                    } else {
                        // Create new schedule linked to this section
                        Schedule newSchedule = scheduleService.createSchedule(
                            updatedSection.getSchedule(), 
                            section.getSectionID()
                        );
                        section.setSchedule(newSchedule);
                    }
                } else if (section.getSchedule() != null) {
                    // If schedule was removed
                    scheduleService.deleteSchedule(section.getSchedule().getScheduleID());
                    section.setSchedule(null);
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
                if (section.getSchedule() != null) {
                    Schedule schedule = section.getSchedule();
                    schedule.setStatus(status);
                    // Persist status update without creating duplicate schedule
                    scheduleService.updateScheduleStatus(schedule.getScheduleID(), status);
                }
                return courseSectionRepository.save(section);
            })
            .orElseThrow(() -> new RuntimeException("Section not found with ID " + id));
    }

    public List<CourseSection> getSectionsByFaculty(Long facultyId) {
        return courseSectionRepository.findByFaculty_FacultyID(facultyId);
    }
}
