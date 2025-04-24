package com.stasis.stasis.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicRecord{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long recordID;

    @OneToOne
    private Student student;

    private Double GA;
    private int totalCredits;
    private String academicStanding;
}