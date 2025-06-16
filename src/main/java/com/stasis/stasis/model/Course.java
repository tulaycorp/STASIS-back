package com.stasis.stasis.model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "courses") // Add table name to match your SQL
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Changed from courseID to id to match your SQL

    @Column(name = "course_code")
    private String courseCode;
    
    @Column(name = "credits")
    private int credits;
    
    @Column(name = "course_description")
    private String courseDescription;

    @Column(name = "program")
    private String program; // Changed to String to match your SQL data
    
    // Add getter method that matches the service usage
    public int getCreditUnits() {
        return this.credits;
    }
}