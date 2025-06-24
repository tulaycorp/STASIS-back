package com.stasis.stasis.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Curriculum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long curriculumID;

    private String curriculumName;
    private String curriculumCode; // Added for frontend
    private String academicYear; // Added for frontend
    private String description; // Added for frontend
    private LocalDate effectiveStartDate;
    private LocalDate lastUpdated; // Added for frontend
    
    @ManyToOne
    @JoinColumn(name = "programID")
    private Program program;
    
    private String status; // Use String instead of boolean for "Active", "Draft", "Inactive"
    
    @JsonManagedReference
    @OneToMany(mappedBy = "curriculum", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CurriculumDetail> curriculumDetails = new ArrayList<>();
}