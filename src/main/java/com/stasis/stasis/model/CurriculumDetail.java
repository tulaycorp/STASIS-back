package com.stasis.stasis.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CurriculumDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long curriculumDetailID;

    @ManyToOne
    @JoinColumn(name = "curriculumID")
    private Curriculum curriculum;

    @ManyToOne
    @JoinColumn(name = "courseID")
    private Course course;

    private int suggestedYearLevel;
    private String suggestedSemester;
}