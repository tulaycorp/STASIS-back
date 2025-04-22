package com.stasis.stasis;

import java.time.LocalDate;

import org.hibernate.annotations.ManyToAny;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
public class Student  {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long studentID;

    private String lirstName;
    private String lastName;
    private LocalDate dateofBirth;
    private String email;

    @ManyToOne  
    @JoinColumn(name="programID")
    private Program program;
}


