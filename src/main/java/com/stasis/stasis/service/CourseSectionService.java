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
        // Use the new method that eagerly loads schedules and courses
        List<CourseSection> sections = courseSectionRepository.findAllWithSchedulesAndCourses();
        System.out.println("=== CourseSectionService.getAllSections ===");
        System.out.println("Total sections found: " + sections.size());
        
        // Debug schedule-course relationships
        for (CourseSection section : sections) {
            System.out.println("Section " + section.getSectionID() + " (" + section.getSectionName() + "):");
            if (section.getSchedules() != null && !section.getSchedules().isEmpty()) {
                for (Schedule schedule : section.getSchedules()) {
                    String courseInfo = schedule.getCourse() != null ? 
                        schedule.getCourse().getCourseCode() + " - " + schedule.getCourse().getCourseDescription() : 
                        "No course assigned";
                    System.out.println("  Schedule " + schedule.getScheduleID() + ": " + courseInfo);
                }
            } else {
                System.out.println("  No schedules found");
            }
        }
        System.out.println("=== End getAllSections ===");
        
        return sections;
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
                // Update basic section properties
                if (updatedSection.getFaculty() != null) {
                    section.setFaculty(updatedSection.getFaculty());
                }
                if (updatedSection.getSectionName() != null) {
                    section.setSectionName(updatedSection.getSectionName());
                }
                if (updatedSection.getSemester() != null) {
                    section.setSemester(updatedSection.getSemester());
                }
                if (updatedSection.getYear() != 0) {
                    section.setYear(updatedSection.getYear());
                }
                if (updatedSection.getProgram() != null) {
                    section.setProgram(updatedSection.getProgram());
                }
                
                // Only update schedules if explicitly provided and non-empty
                // This prevents accidental deletion of schedules when just updating faculty
                if (updatedSection.getSchedules() != null && !updatedSection.getSchedules().isEmpty()) {
                    // Delete existing schedules only when we have new ones to replace them
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
                }
                // If schedules is null or empty, don't modify existing schedules
                
                return courseSectionRepository.save(section);
            })
            .orElseThrow(() -> new RuntimeException("Section not found with id: " + id));
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
