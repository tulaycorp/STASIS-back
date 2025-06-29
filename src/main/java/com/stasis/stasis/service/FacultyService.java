package com.stasis.stasis.service;

import com.stasis.stasis.model.Advisor;
import com.stasis.stasis.model.Faculty;
import com.stasis.stasis.model.Users;
import com.stasis.stasis.model.UserRole;
import com.stasis.stasis.repository.AdvisorRepository;
import com.stasis.stasis.repository.FacultyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class FacultyService {

    @Autowired
    private FacultyRepository facultyRepository;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private AdvisorRepository advisorRepository;

    @Autowired
    private EmailValidationService emailValidationService;

    public List<Faculty> getAllFaculty() {
        List<Faculty> faculty = facultyRepository.findAll();
        // Populate username for each faculty member
        for (Faculty facultyMember : faculty) {
            Optional<Users> user = userService.getUserByFacultyInfo(facultyMember.getFirstName(), facultyMember.getLastName());
            if (user.isPresent()) {
                facultyMember.setUsername(user.get().getUsername());
            }
        }
        return faculty;
    }

    public Optional<Faculty> getFacultyById(Long id) {
        Optional<Faculty> facultyOpt = facultyRepository.findById(id);
        if (facultyOpt.isPresent()) {
            Faculty faculty = facultyOpt.get();
            // Populate username
            Optional<Users> user = userService.getUserByFacultyInfo(faculty.getFirstName(), faculty.getLastName());
            if (user.isPresent()) {
                faculty.setUsername(user.get().getUsername());
            }
        }
        return facultyOpt;
    }

    public class FacultyWithCredentials {
        private final Faculty faculty;
        private final String username;
        private final String password;

        public FacultyWithCredentials(Faculty faculty, String username, String password) {
            this.faculty = faculty;
            this.username = username;
            this.password = password;
        }

        public Faculty getFaculty() { return faculty; }
        public String getUsername() { return username; }
        public String getPassword() { return password; }
    }

    public FacultyWithCredentials createFaculty(Faculty faculty) {
        // Validate email uniqueness across both students and faculty
        if (!emailValidationService.isEmailUnique(faculty.getEmail())) {
            throw new RuntimeException("Email already exists in the system");
        }
        
        Faculty savedFaculty = facultyRepository.save(faculty);

        // Create User account for the faculty with auto-generated credentials
        // Format: [year]-[counter starting from 10000]-[F for faculty]
        // Password: randomly generated 7 character alphanumeric string
        Users user = userService.createUserWithGeneratedCredentials(
                savedFaculty.getFirstName(),
                savedFaculty.getLastName(),
                savedFaculty.getEmail(),
                UserRole.FACULTY
        );

        return new FacultyWithCredentials(savedFaculty, user.getUsername(), user.getPassword());
    }

    public Faculty updateFaculty(Long id, Faculty facultyDetails) {
        return facultyRepository.findById(id)
            .map(faculty -> {
                // Validate email uniqueness if email is being changed
                if (!faculty.getEmail().equals(facultyDetails.getEmail()) && 
                    !emailValidationService.isEmailUniqueForFaculty(facultyDetails.getEmail(), id)) {
                    throw new IllegalArgumentException("Email already exists in the system");
                }
                
                faculty.setFirstName(facultyDetails.getFirstName());
                faculty.setLastName(facultyDetails.getLastName());
                faculty.setEmail(facultyDetails.getEmail());
                faculty.setStatus(facultyDetails.getStatus());
                faculty.setPosition(facultyDetails.getPosition());
                faculty.setProgram(facultyDetails.getProgram());
                return facultyRepository.save(faculty);
            })
            .orElseThrow(() -> new RuntimeException("Faculty not found with id " + id));
    }

    @Transactional
    public void deleteFaculty(Long id) {
        Optional<Faculty> facultyOpt = facultyRepository.findById(id);
        if (facultyOpt.isEmpty()) {
            throw new RuntimeException("Faculty not found with id: " + id);
        }
        
        Faculty faculty = facultyOpt.get();
        
        // Delete related records in the correct order to avoid foreign key constraint violations
        
        // 1. Delete advisor relationships where this faculty is an advisor
        List<Advisor> advisorships = advisorRepository.findByFaculty(faculty);
        advisorRepository.deleteAll(advisorships);
        
        // 2. Delete associated user account
        userService.deleteUserByFacultyInfo(faculty.getFirstName(), faculty.getLastName());
        
        // 3. Finally delete the faculty
        facultyRepository.deleteById(id);
    }

    // Add new service methods for Faculty-specific operations
    public List<Faculty> getFacultyByProgram(Long programId) {
        return facultyRepository.findByProgram_ProgramID(programId);
    }

    public List<Faculty> getFacultyByStatus(String status) {
        return facultyRepository.findByStatus(status);
    }

    public List<Faculty> getFacultyByPosition(String position) {
        return facultyRepository.findByPosition(position);
    }

    public List<Faculty> searchFacultyByName(String searchTerm) {
        return facultyRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            searchTerm, searchTerm);
    }

    public List<Faculty> getActiveFaculty() {
        return facultyRepository.findByStatus("Active");
    }

    public Faculty updateFacultyStatus(Long id, String status) {
        return facultyRepository.findById(id)
            .map(faculty -> {
                faculty.setStatus(status);
                return facultyRepository.save(faculty);
            })
            .orElseThrow(() -> new RuntimeException("Faculty not found with ID " + id));
    }

    public boolean existsByEmail(String email) {
        return facultyRepository.existsByEmail(email);
    }

    public Optional<Faculty> getFacultyByEmail(String email) {
        return facultyRepository.findByEmail(email);
    }
}
