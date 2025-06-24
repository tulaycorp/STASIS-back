package com.stasis.stasis.model;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long sectionID;

    @ManyToOne
    private Course course;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "program_id")
    private Program program;

    @ManyToOne
    private Faculty faculty;

    private String sectionName; // New field for section name (e.g., "A", "B", "CS101-A")
    private String semester;
    private int year;
    
    // Schedule fields - broken down for better structure
    private LocalTime startTime;
    private LocalTime endTime;
    private String day; // e.g., "MWF", "TTH", "MONDAY", etc.
    private String status; // e.g., "ACTIVE", "CANCELLED", "FULL", etc.
    
    private String room;
}
