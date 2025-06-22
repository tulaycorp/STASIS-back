package com.stasis.stasis.service;

import com.stasis.stasis.model.AcademicRecord;
import com.stasis.stasis.model.Student;
import com.stasis.stasis.model.Users;
import com.stasis.stasis.model.UserRole;
import com.stasis.stasis.repository.StudentRepository;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final AcademicRecordService academicRecordService;
    private final UserService userService;

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
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
        Users user = userService.createUserWithGeneratedCredentials(
                savedStudent.getFirstName(), 
                savedStudent.getLastName(), 
                UserRole.STUDENT
        );

        return new StudentWithCredentials(savedStudent, user.getUsername(), user.getPassword());
    }

    public Student updateStudent(Long id, Student studentDetails) {
        return studentRepository.findById(id)
            .map(student -> {
                student.setFirstName(studentDetails.getFirstName());
                student.setLastName(studentDetails.getLastName());
                student.setEmail(studentDetails.getEmail());
                student.setDateOfBirth(studentDetails.getDateOfBirth());
                student.setYear_level(studentDetails.getYear_level());
                if (studentDetails.getProgram() != null) {
                    student.setProgram(studentDetails.getProgram());
                }
                return studentRepository.save(student);
            })
            .orElseThrow(() -> new RuntimeException("Student not found with id: " + id));
    }

    public void deleteStudent(Long id) {
        studentRepository.deleteById(id);
    }

    public Student promoteStudent(Long id) {
        return studentRepository.findById(id)
            .map(student -> {
                if (student.getYear_level() < 4) {
                    student.setYear_level(student.getYear_level() + 1);
                }
                return studentRepository.save(student);
            })
            .orElseThrow(() -> new RuntimeException("Student not found with id: " + id));
    }
}