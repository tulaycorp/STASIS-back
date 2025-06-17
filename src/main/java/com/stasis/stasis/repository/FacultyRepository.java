package com.stasis.stasis.repository;

import com.stasis.stasis.model.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    
    // Find faculty by program
    List<Faculty> findByProgram_ProgramID(Long programId);
    
    // Find faculty by status
    List<Faculty> findByStatus(String status);
    
    // Find faculty by position
    List<Faculty> findByPosition(String position);
    
    // Find faculty by email
    Optional<Faculty> findByEmail(String email);
    
    // Check if email exists
    boolean existsByEmail(String email);
    
    // Search faculty by name (case insensitive)
    List<Faculty> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
        String firstName, String lastName);
    
    // Find faculty by first name and last name
    List<Faculty> findByFirstNameAndLastName(String firstName, String lastName);
    
    // Find faculty by program and status
    List<Faculty> findByProgram_ProgramIDAndStatus(Long programId, String status);
    
    // Find faculty by position and status
    List<Faculty> findByPositionAndStatus(String position, String status);
}
