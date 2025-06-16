package com.stasis.stasis.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

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
    private LocalDate effectiveStartDate;
    
    @ManyToOne
    @JoinColumn(name = "programID")
    private Program program;
    
    private boolean isActive;
}