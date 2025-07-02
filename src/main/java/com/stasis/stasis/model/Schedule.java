package com.stasis.stasis.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    
    // No reference to CourseSection to avoid circular reference
}
