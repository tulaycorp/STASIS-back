package com.stasis.stasis.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long scheduleID;

    private LocalTime startTime;
    private LocalTime endTime;
    private String day;
    private String status;
    private String room;

    @OneToOne
    @JoinColumn(name = "course_section_id", nullable = false)
    private CourseSection courseSection;

    // Transient field for API requests
    @Transient
    @JsonProperty("courseSectionId")
    private Long courseSectionId;

    // Helper methods to expose course and faculty data
    @JsonProperty("courseCode")
    public String getCourseCode() {
        if (courseSection != null && courseSection.getCourse() != null) {
            return courseSection.getCourse().getCourseCode();
        }
        return null;
    }

    @JsonProperty("courseName")
    public String getCourseName() {
        return courseSection != null && courseSection.getCourse() != null ? 
            courseSection.getCourse().getCourseDescription() : null;
    }

    @JsonProperty("sectionName")
    public String getSectionName() {
        return courseSection != null ? courseSection.getSectionName() : null;
    }

    @JsonProperty("instructor")
    public String getInstructor() {
        if (courseSection != null && courseSection.getFaculty() != null) {
            Faculty faculty = courseSection.getFaculty();
            return faculty.getFirstName() + " " + faculty.getLastName();
        }
        return null;
    }

    @JsonProperty("instructorId")
    public Long getInstructorId() {
        return courseSection != null && courseSection.getFaculty() != null ?
            courseSection.getFaculty().getFacultyID() : null;
    }

    // Helper method to set courseSection based on courseSectionId
    @PostLoad
    private void onLoad() {
        if (courseSection != null) {
            courseSectionId = courseSection.getSectionID();
        }
    }
}
