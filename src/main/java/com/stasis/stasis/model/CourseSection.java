package com.stasis.stasis.model;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long sectionID;

    // Remove single course reference since we now support multiple courses per section
    // Courses are now managed through the Schedule entities
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "program_id")
    private Program program;

    @ManyToOne
    private Faculty faculty;

    private String sectionName; 
    private String semester;
    private int year;
    
    // Multiple schedules, each potentially with different courses
    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "course_section_id")
    private List<Schedule> schedules;
}
