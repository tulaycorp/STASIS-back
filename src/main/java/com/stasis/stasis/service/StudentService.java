package com.stasis.stasis.service;

import com.stasis.stasis.model.AcademicRecord;
import com.stasis.stasis.model.Advisor;
import com.stasis.stasis.model.SemesterEnrollment;
import com.stasis.stasis.model.Student;
import com.stasis.stasis.model.Users;
import com.stasis.stasis.model.UserRole;
import com.stasis.stasis.repository.AdvisorRepository;
import com.stasis.stasis.repository.SemesterEnrollmentRepository;
import com.stasis.stasis.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final AcademicRecordService academicRecordService;
    private final UserService userService;
    private final AdvisorRepository advisorRepository;
    private final SemesterEnrollmentRepository semesterEnrollmentRepository;

    @Autowired
    private EmailValidationService emailValidationService;

    public List<Student> getAllStudents() {
        List<Student> students = studentRepository.findAll();
        // Populate username for each student
        for (Student student : students) {
            Optional<Users> user = userService.getUserByStudentInfo(student.getFirstName(), student.getLastName());
            if (user.isPresent()) {
                student.setUsername(user.get().getUsername());
            }
        }
        return students;
    }

    public Optional<Student> getStudentById(Long id) {
        Optional<Student> studentOpt = studentRepository.findById(id);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            // Populate username
            Optional<Users> user = userService.getUserByStudentInfo(student.getFirstName(), student.getLastName());
            if (user.isPresent()) {
                student.setUsername(user.get().getUsername());
            }
        }
        return studentOpt;
    }

    // Add this method to get student count
    public long getStudentCount() {
        return studentRepository.count();
    }

    public class StudentWithCredentials {
        private final Student student;
        private final String username;
        private final String password;

        public StudentWithCredentials(Student student, String username, String password) {
            this.student = student;
            this.username = username;
            this.password = password;
        }

        public Student getStudent() { return student; }
        public String getUsername() { return username; }
        public String getPassword() { return password; }
    }

    public StudentWithCredentials createStudent(Student student) {
        // Validate email uniqueness across both students and faculty
        if (!emailValidationService.isEmailUnique(student.getEmail())) {
            throw new RuntimeException("Email already exists in the system");
        }
        
        Student savedStudent = studentRepository.save(student);

        // Create AcademicRecord for the student
        AcademicRecord academicRecord = AcademicRecord.builder()
                .student(savedStudent)
                .GA(0.0)
                .totalCredits(0)
                .academicStanding("Good")
                .build();
        academicRecordService.createRecord(academicRecord);

        // Create User account for the student with auto-generated credentials
        // Format: [year]-[counter starting from 10000]-[S for student]
        // Password: randomly generated 7 character alphanumeric string
        com.stasis.stasis.dto.UserWithPlainPassword userWithPassword = userService.createUserWithGeneratedCredentialsForDisplay(
                savedStudent.getFirstName(), 
                savedStudent.getLastName(), 
                savedStudent.getEmail(),
                UserRole.STUDENT
        );

        return new StudentWithCredentials(savedStudent, userWithPassword.getUser().getUsername(), userWithPassword.getPlainTextPassword());
    }

    public Student updateStudent(Long id, Student studentDetails) {
        return studentRepository.findById(id)
            .map(student -> {
                // Validate email uniqueness if email is being changed
                if (!student.getEmail().equals(studentDetails.getEmail()) && 
                    !emailValidationService.isEmailUniqueForStudent(studentDetails.getEmail(), id)) {
                    throw new IllegalArgumentException("Email already exists in the system");
                }
                
                // Get the user record BEFORE updating the student (using old name)
                Optional<Users> userOpt = userService.getUserByStudentInfo(student.getFirstName(), student.getLastName());
                
                // Update student information
                student.setFirstName(studentDetails.getFirstName());
                student.setLastName(studentDetails.getLastName());
                student.setEmail(studentDetails.getEmail());
                student.setDateOfBirth(studentDetails.getDateOfBirth());
                student.setYear_level(studentDetails.getYear_level());
                student.setProgram(studentDetails.getProgram());
                student.setSection(studentDetails.getSection());
                student.setCurriculum(studentDetails.getCurriculum());
                
                Student updatedStudent = studentRepository.save(student);
                
                // Update the associated user record if it exists
                if (userOpt.isPresent()) {
                    Users user = userOpt.get();
                    user.setFirstName(studentDetails.getFirstName());
                    user.setLastName(studentDetails.getLastName());
                    user.setEmail(studentDetails.getEmail());
                    userService.updateUser(user);
                    
                    // Set the username on the student object for the response
                    updatedStudent.setUsername(user.getUsername());
                }
                
                return updatedStudent;
            })
            .orElseThrow(() -> new RuntimeException("Student not found with id " + id));
    }

    @Transactional
    public void deleteStudent(Long id) {
        Optional<Student> studentOpt = studentRepository.findById(id);
        if (studentOpt.isEmpty()) {
            throw new RuntimeException("Student not found with id: " + id);
        }
        
        Student student = studentOpt.get();
        
        // Delete related records in the correct order to avoid foreign key constraint violations
        
        // 1. Delete semester enrollments (this will cascade to enrolled courses and grades)
        List<SemesterEnrollment> semesterEnrollments = semesterEnrollmentRepository.findByStudent_Id(id);
        semesterEnrollmentRepository.deleteAll(semesterEnrollments);
        
        // 2. Delete advisor relationships
        List<Advisor> advisors = advisorRepository.findByStudent(student);
        advisorRepository.deleteAll(advisors);
        
        // 3. Delete academic record
        academicRecordService.deleteRecordByStudent(student);
        
        // 4. Delete associated user account
        userService.deleteUserByStudentInfo(student.getFirstName(), student.getLastName());
        
        // 5. Finally delete the student
        studentRepository.deleteById(id);
    }
    

    public Student promoteStudent(Long id) {
        return studentRepository.findById(id)
            .map(student -> {
                if (student.getYear_level() < 4) {
                    student.setYear_level(student.getYear_level() + 1);
                }
                
                Student promotedStudent = studentRepository.save(student);
                
                // Populate username for consistency with getAllStudents() and getStudentById()
                Optional<Users> user = userService.getUserByStudentInfo(promotedStudent.getFirstName(), promotedStudent.getLastName());
                if (user.isPresent()) {
                    promotedStudent.setUsername(user.get().getUsername());
                }
                
                return promotedStudent;
            })
            .orElseThrow(() -> new RuntimeException("Student not found with id: " + id));
    }
}