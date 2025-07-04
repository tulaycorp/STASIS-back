// Example components showing proper usage of the new authentication system

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  enrolledCourseAPI, 
  getCurrentUser, 
  getCurrentStudentId, 
  getCurrentFacultyId,
  isAuthenticated 
} from '../services/api-fixed';

// Example: Student data component that uses the new authentication
const StudentDataExample = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const currentUser = getCurrentUser();
  const studentId = getCurrentStudentId();

  useEffect(() => {
    // Check if user is authenticated and has correct role
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!studentId) {
      setError('Access denied: Student role required');
      return;
    }

    fetchStudentEnrollments();
  }, [studentId, navigate]);

  const fetchStudentEnrollments = async () => {
    try {
      setLoading(true);
      
      // This call will be automatically authenticated with session cookies
      // Backend will verify that the user can only access their own data
      const response = await enrolledCourseAPI.getEnrolledCoursesByStudent(studentId);
      
      setEnrollments(response.data);
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
      
      if (error.response?.status === 401) {
        // Authentication failed - redirect to login
        navigate('/login');
      } else if (error.response?.status === 403) {
        setError('Access denied: You can only view your own enrollments');
      } else {
        setError('Failed to load enrollment data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading your enrollments...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>My Enrollments</h3>
      <p>Welcome, {currentUser.username} (Student ID: {studentId})</p>
      
      {enrollments.length === 0 ? (
        <p>No enrollments found.</p>
      ) : (
        <ul>
          {enrollments.map(enrollment => (
            <li key={enrollment.id}>
              Course: {enrollment.course?.courseName} - 
              Grade: {enrollment.grade?.overallGrade || 'No grade yet'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Example: Faculty grade management component
const FacultyGradeExample = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const currentUser = getCurrentUser();
  const facultyId = getCurrentFacultyId();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!facultyId) {
      setError('Access denied: Faculty role required');
      return;
    }

    fetchFacultyEnrollments();
  }, [facultyId, navigate]);

  const fetchFacultyEnrollments = async () => {
    try {
      setLoading(true);
      
      // Backend will only return enrollments for courses assigned to this faculty
      const response = await enrolledCourseAPI.getByFaculty(facultyId);
      
      setEnrollments(response.data);
    } catch (error) {
      console.error('Failed to fetch faculty enrollments:', error);
      
      if (error.response?.status === 401) {
        navigate('/login');
      } else if (error.response?.status === 403) {
        setError('Access denied: You can only manage your assigned courses');
      } else {
        setError('Failed to load enrollment data');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateGrade = async (enrollmentId, gradeData) => {
    try {
      // Backend will verify faculty can only update grades for their courses
      await enrolledCourseAPI.updateGrades(enrollmentId, gradeData);
      
      // Refresh the data
      fetchFacultyEnrollments();
      
      alert('Grade updated successfully');
    } catch (error) {
      console.error('Failed to update grade:', error);
      
      if (error.response?.status === 403) {
        alert('Access denied: You can only update grades for your assigned courses');
      } else {
        alert('Failed to update grade');
      }
    }
  };

  if (loading) return <div>Loading enrollments...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Manage Grades</h3>
      <p>Welcome, {currentUser.username} (Faculty ID: {facultyId})</p>
      
      {enrollments.length === 0 ? (
        <p>No enrollments found for your courses.</p>
      ) : (
        <div>
          {enrollments.map(enrollment => (
            <div key={enrollment.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
              <p>Student: {enrollment.student?.firstName} {enrollment.student?.lastName}</p>
              <p>Course: {enrollment.course?.courseName}</p>
              <p>Current Grade: {enrollment.grade?.overallGrade || 'No grade'}</p>
              
              <button onClick={() => {
                const newGrade = prompt('Enter new grade (0-100):');
                if (newGrade && !isNaN(newGrade)) {
                  updateGrade(enrollment.id, {
                    overallGrade: parseFloat(newGrade),
                    remark: parseFloat(newGrade) >= 75 ? 'PASSED' : 'FAILED'
                  });
                }
              }}>
                Update Grade
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { StudentDataExample, FacultyGradeExample };
