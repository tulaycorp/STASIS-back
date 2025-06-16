package com.stasis.stasis.model;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long courseID;

    private String courseCode;
    private int credits; // This should match the getter method
    private String courseDescription;

    @ManyToOne
    @JoinColumn(name = "programID")
    private Program program;
    
    // Add getter method that matches the service usage
    public int getCreditUnits() {
        return this.credits;
    }
}