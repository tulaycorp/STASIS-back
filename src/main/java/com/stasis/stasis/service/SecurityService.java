package com.stasis.stasis.service;

import com.stasis.stasis.model.Users;
import com.stasis.stasis.model.Student;
import com.stasis.stasis.model.Faculty;
import com.stasis.stasis.model.EnrolledCourse;
import com.stasis.stasis.repository.UserRepository;
import com.stasis.stasis.repository.StudentRepository;
import com.stasis.stasis.repository.FacultyRepository;
import com.stasis.stasis.repository.EnrolledCourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.List;

@Service("securityService")
public class SecurityService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private FacultyRepository facultyRepository;
    
    @Autowired
    private EnrolledCourseRepository enrolledCourseRepository;

    /**
     * Check if the currently authenticated user is the same as the requested student
     */
    public boolean isCurrentUser(Long studentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            System.out.println("SecurityService: No authentication or not authenticated");
            return false;
        }

        String username = auth.getName();
        Users currentUser = userRepository.findByUsername(username);
        
        if (currentUser == null) {
            System.out.println("SecurityService: Current user not found for username: " + username);
            return false;
        }

        // Check if current user is a student role
        if (!currentUser.getRole().name().equals("STUDENT")) {
            System.out.println("SecurityService: Current user is not a student, role: " + currentUser.getRole());
            return false;
        }

        // Find the student associated with the current user
        Optional<Student> currentStudentOpt = studentRepository.findByFirstNameAndLastName(
            currentUser.getFirstName(), currentUser.getLastName());
        
        if (!currentStudentOpt.isPresent()) {
            System.out.println("SecurityService: Student record not found for user: " + currentUser.getFirstName() + " " + currentUser.getLastName());
            return false;
        }

        Student currentStudent = currentStudentOpt.get();
        boolean isMatch = currentStudent.getId().equals(studentId);
        
        System.out.println("SecurityService: Checking student access - Current student ID: " + currentStudent.getId() + 
                          ", Requested student ID: " + studentId + ", Match: " + isMatch);
        
        return isMatch;
    }

    /**
     * Check if the currently authenticated faculty is the same as the requested faculty
     */
    public boolean isCurrentFaculty(Long facultyId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            System.out.println("SecurityService: No authentication or not authenticated");
            return false;
        }

        String username = auth.getName();
        Users currentUser = userRepository.findByUsername(username);
        
        if (currentUser == null) {
            System.out.println("SecurityService: Current user not found for username: " + username);
            return false;
        }

        // Check if current user is a faculty role
        if (!currentUser.getRole().name().equals("FACULTY")) {
            System.out.println("SecurityService: Current user is not faculty, role: " + currentUser.getRole());
            return false;
        }

        // Find the faculty associated with the current user
        List<Faculty> facultyList = facultyRepository.findByFirstNameAndLastName(
            currentUser.getFirstName(), currentUser.getLastName());
        
        if (facultyList.isEmpty()) {
            System.out.println("SecurityService: Faculty record not found for user: " + currentUser.getFirstName() + " " + currentUser.getLastName());
            return false;
        }

        Faculty currentFaculty = facultyList.get(0);
        boolean isMatch = currentFaculty.getFacultyID().equals(facultyId);
        
        System.out.println("SecurityService: Checking faculty access - Current faculty ID: " + currentFaculty.getFacultyID() + 
                          ", Requested faculty ID: " + facultyId + ", Match: " + isMatch);
        
        return isMatch;
    }

    /**
     * Get the current authenticated user
     */
    public Users getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }

        String username = auth.getName();
        return userRepository.findByUsername(username);
    }

    /**
     * Get the current authenticated user's student ID if they are a student
     */
    public Long getCurrentStudentId() {
        Users currentUser = getCurrentUser();
        if (currentUser == null || !currentUser.getRole().name().equals("STUDENT")) {
            return null;
        }

        Optional<Student> student = studentRepository.findByFirstNameAndLastName(
            currentUser.getFirstName(), currentUser.getLastName());
        
        return student.map(Student::getId).orElse(null);
    }

    /**
     * Get the current authenticated user's faculty ID if they are faculty
     */
    public Long getCurrentFacultyId() {
        Users currentUser = getCurrentUser();
        if (currentUser == null || !currentUser.getRole().name().equals("FACULTY")) {
            return null;
        }

        // Assuming Faculty has a similar method - you may need to adjust based on your Faculty repository
        Optional<Faculty> faculty = facultyRepository.findByFirstNameAndLastName(
            currentUser.getFirstName(), currentUser.getLastName()).stream().findFirst();
        
        return faculty.map(Faculty::getFacultyID).orElse(null);
    }

    /**
     * Check if the current user can access/modify a specific enrollment
     */
    public boolean canAccessEnrollment(Long enrollmentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            System.out.println("SecurityService: No authentication for enrollment access check");
            return false;
        }

        String username = auth.getName();
        Users currentUser = userRepository.findByUsername(username);
        
        if (currentUser == null) {
            System.out.println("SecurityService: Current user not found for enrollment access: " + username);
            return false;
        }

        // Admin can access any enrollment
        if ("ADMIN".equals(currentUser.getRole().name())) {
            System.out.println("SecurityService: Admin access granted for enrollment: " + enrollmentId);
            return true;
        }

        // For students, check if the enrollment belongs to them
        if ("STUDENT".equals(currentUser.getRole().name())) {
            Optional<Student> currentStudentOpt = studentRepository.findByFirstNameAndLastName(
                currentUser.getFirstName(), currentUser.getLastName());
            
            if (currentStudentOpt.isPresent()) {
                Student currentStudent = currentStudentOpt.get();
                
                // Find the enrollment and check if it belongs to this student
                Optional<EnrolledCourse> enrollmentOpt = enrolledCourseRepository.findById(enrollmentId);
                if (enrollmentOpt.isPresent()) {
                    EnrolledCourse enrollment = enrollmentOpt.get();
                    Long enrollmentStudentId = enrollment.getSemesterEnrollment().getStudent().getId();
                    boolean isOwner = currentStudent.getId().equals(enrollmentStudentId);
                    
                    System.out.println("SecurityService: Student " + currentStudent.getId() + 
                                     " checking enrollment " + enrollmentId + 
                                     " (belongs to student " + enrollmentStudentId + ") - Owner: " + isOwner);
                    return isOwner;
                } else {
                    System.out.println("SecurityService: Enrollment not found: " + enrollmentId);
                    return false;
                }
            }
        }

        System.out.println("SecurityService: Access denied for enrollment: " + enrollmentId);
        return false;
    }
}
