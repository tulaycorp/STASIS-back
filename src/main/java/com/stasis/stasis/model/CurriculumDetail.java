package com.stasis.stasis.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "curriculum")
@EqualsAndHashCode(exclude = "curriculum")
public class CurriculumDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long curriculumDetailID;

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "curriculumID")
    private Curriculum curriculum;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "courseID")
    private Course course;

    private int YearLevel;
    private String Semester;
}