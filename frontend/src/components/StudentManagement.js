import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentManagement.css';
import Sidebar from './Sidebar';
import { studentAPI, programAPI, testConnection } from '../services/api';

const StudentManagement = () => {
  const [studentsData, setStudentsData] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [selectedProgram, setSelectedProgram] = useState('All Programs');
  const [editingStudent, setEditingStudent] = useState(null);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    year_level: 1,
    programId: ''
  });

  // Available sections for filtering
  const sections = ['All Sections', 'Year 1', 'Year 2', 'Year 3', 'Year 4'];

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test connection first
      const connectionTest = await testConnection();
      if (!connectionTest.success) {
        throw new Error(`Connection failed: ${connectionTest.error}`);
      }

      // Load students and programs in parallel
      const [studentsResponse, programsResponse] = await Promise.all([
        studentAPI.getAllStudents(),
        programAPI.getAllPrograms()
      ]);

      setStudentsData(studentsResponse.data);
      setProgramsList(programsResponse.data);
      
      // Set default selected program if programs exist
      if (programsResponse.data.length > 0) {
        setSelectedProgram('All Programs');
      }
      
    } catch (err) {
      console.error('Error loading data:', err);
      handleConnectionError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionError = (err) => {
    if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
      setError('Cannot connect to server. Please check if the backend is running on http://localhost:8080');
    } else if (err.code === 'ECONNREFUSED') {
      setError('Connection refused. The backend server is not running.');
    } else if (err.response?.status === 404) {
      setError('API endpoint not found. Please check if the server is properly configured.');
    } else if (err.response?.status === 500) {
      setError('Server error. Please check the backend console for error details.');
    } else {
      setError(`Failed to load data: ${err.message}`);
    }
  };

  // Filter students based on search term and selected program
  const filteredStudents = studentsData.filter(student => {
    const matchesSearch = 
      student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProgram = selectedProgram === 'All Programs' || 
      student.program?.programName === selectedProgram;
    
    return matchesSearch && matchesProgram;
  });

  // Student Modal functions
  const showAddStudentForm = () => {
    setStudentForm({
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      year_level: 1,
      programId: ''
    });
    setShowAddStudentModal(true);
  };

  const closeAddStudentModal = () => {
    setShowAddStudentModal(false);
    setStudentForm({
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      year_level: 1,
      programId: ''
    });
  };

  const showEditStudentForm = (student) => {
    setEditingStudent(student);
    setStudentForm({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      dateOfBirth: student.dateOfBirth || '',
      year_level: student.year_level || 1,
      programId: student.program?.programID?.toString() || ''
    });
    setShowEditStudentModal(true);
  };

  const closeEditStudentModal = () => {
    setShowEditStudentModal(false);
    setEditingStudent(null);
    setStudentForm({
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      year_level: 1,
      programId: ''
    });
  };

  const handleStudentFormChange = (field, value) => {
    setStudentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddStudent = async () => {
    // Validate required fields
    if (!studentForm.firstName || !studentForm.lastName || !studentForm.email) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentForm.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      // Find the selected program object
      const selectedProgramObj = programsList.find(p => p.programID.toString() === studentForm.programId);
      
      const studentData = {
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        email: studentForm.email,
        dateOfBirth: studentForm.dateOfBirth,
        year_level: parseInt(studentForm.year_level),
        program: selectedProgramObj || null
      };

      const response = await studentAPI.createStudent(studentData);
      setGeneratedCredentials(response.data);
      closeAddStudentModal();
      setShowCredentialsModal(true);
      loadInitialData(); // Reload student list
    } catch (error) {
      console.error('Error adding student:', error);
      if (error.response?.status === 400) {
        alert('Email already exists or invalid data provided!');
      } else {
        alert('Failed to add student. Please try again.');
      }
    }
  };

  const handleEditStudent = async () => {
    // Validate required fields
    if (!studentForm.firstName || !studentForm.lastName || !studentForm.email) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentForm.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      // Find the selected program object
      const selectedProgramObj = programsList.find(p => p.programID.toString() === studentForm.programId);
      
      const studentData = {
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        email: studentForm.email,
        dateOfBirth: studentForm.dateOfBirth,
        year_level: parseInt(studentForm.year_level),
        program: selectedProgramObj || null
      };

      await studentAPI.updateStudent(editingStudent.id, studentData);
      alert('Student updated successfully!');
      closeEditStudentModal();
      loadInitialData(); // Reload student list
    } catch (error) {
      console.error('Error updating student:', error);
      if (error.response?.status === 400) {
        alert('Email already exists or invalid data provided!');
      } else if (error.response?.status === 404) {
        alert('Student not found!');
      } else {
        alert('Failed to update student. Please try again.');
      }
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentAPI.deleteStudent(studentId);
        alert('Student deleted successfully!');
        loadInitialData(); // Reload student list
      } catch (error) {
        console.error('Error deleting student:', error);
        if (error.response?.status === 404) {
          alert('Student not found!');
        } else {
          alert('Failed to delete student. Please try again.');
        }
      }
    }
  };

  const handlePromoteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to promote this student to the next year level?')) {
      try {
        await studentAPI.promoteStudent(studentId);
        alert('Student promoted successfully!');
        loadInitialData(); // Reload student list
      } catch (error) {
        console.error('Error promoting student:', error);
        if (error.response?.status === 404) {
          alert('Student not found!');
        } else {
          alert('Failed to promote student. Please try again.');
        }
      }
    }
  };

  // Navigation
  const navigate = useNavigate();
  
  const showSection = (section) => {
    switch(section){
      case 'Dashboard':
        navigate('/admin-dashboard');
        break;
      case 'Curriculum':
        navigate('/curriculum-management');
        break;
      case 'Students':
        navigate('/student-management');
        break;
      case 'Schedule':
        navigate('/schedule-management');
        break;
      case 'Faculty':
        navigate('/faculty-management');
        break;
      case 'Courses':
        navigate('/course-management');
        break;
      case 'Settings':
        navigate('/settings');
        break;
      case 'AdminTools':
        navigate('/admin-tools');
        break;
      default:
        // No action for unknown sections
    }
  };

  // Handle program selection
  const handleProgramSelect = (programName) => {
    setSelectedProgram(programName);
    setSelectedSection('All Sections');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar 
          onNavigate={showSection}
          userInfo={{ name: "David Anderson", role: "Faculty Admin" }}
          sections={[
            {
              items: [{ id: 'Dashboard', label: 'Dashboard', icon: '📊' }]
            },
            {
              label: 'Management',
              items: [
                { id: 'Students', label: 'Students', icon: '👥' },
                { id: 'Curriculum', label: 'Curriculum', icon: '📚' },
                { id: 'Schedule', label: 'Schedule', icon: '📅' },
                { id: 'Faculty', label: 'Faculty', icon: '👨‍🏫' },
                { id: 'Courses', label: 'Courses', icon: '📖' }
              ]
            },
            {
              label: 'System',
              items: [
                { id: 'Settings', label: 'Settings', icon: '⚙️'},
                { id: 'AdminTools', label: 'Admin Tools', icon: '🔧'}
              ]
            }
          ]}
        />
        <div className="main-content">
          <div className="content-wrapper">
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h3>Loading students...</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="dashboard-container">
        <Sidebar 
          onNavigate={showSection}
          userInfo={{ name: "David Anderson", role: "Faculty Admin" }}
          sections={[
            {
              items: [{ id: 'Dashboard', label: 'Dashboard', icon: '📊' }]
            },
            {
              label: 'Management',
              items: [
                { id: 'Students', label: 'Students', icon: '👥' },
                { id: 'Curriculum', label: 'Curriculum', icon: '📚' },
                { id: 'Schedule', label: 'Schedule', icon: '📅' },
                { id: 'Faculty', label: 'Faculty', icon: '👨‍🏫' },
                { id: 'Courses', label: 'Courses', icon: '📖' }
              ]
            },
            {
              label: 'System',
              items: [
                { id: 'Settings', label: 'Settings', icon: '⚙️'},
                { id: 'AdminTools', label: 'Admin Tools', icon: '🔧'}
              ]
            }
          ]}
        />
        <div className="main-content">
          <div className="content-wrapper">
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="error-container">
                <h3>Connection Error</h3>
                <p style={{ whiteSpace: 'pre-line', margin: '1rem 0' }}>{error}</p>
                <div style={{ marginTop: '1rem' }}>
                  <h4>Troubleshooting Steps:</h4>
                  <ol style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
                    <li>Check if Spring Boot is running: <code>http://localhost:8080</code></li>
                    <li>Check browser console for additional errors</li>
                    <li>Verify backend logs for any startup errors</li>
                    <li>Try accessing the API directly: <code>http://localhost:8080/api/students</code></li>
                  </ol>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                  <button onClick={loadInitialData} className="btn btn-primary">
                    Retry Connection
                  </button>
                  <button 
                    onClick={() => window.open('http://localhost:8080/api/students', '_blank')} 
                    className="btn btn-secondary"
                  >
                    Test API Directly
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar 
        onNavigate={showSection}
        userInfo={{ name: "David Anderson", role: "Faculty Admin" }}
        sections={[
          {
            items: [{ id: 'Dashboard', label: 'Dashboard', icon: '📊' }]
          },
          {
            label: 'Management',
            items: [
              { id: 'Students', label: 'Students', icon: '👥' },
              { id: 'Curriculum', label: 'Curriculum', icon: '📚' },
              { id: 'Schedule', label: 'Schedule', icon: '📅' },
              { id: 'Faculty', label: 'Faculty', icon: '👨‍🏫' },
              { id: 'Courses', label: 'Courses', icon: '📖' }
            ]
          },
          {
            label: 'System',
            items: [
              { id: 'Settings', label: 'Settings', icon: '⚙️'},
              { id: 'AdminTools', label: 'Admin Tools', icon: '🔧'}
            ]
          }
        ]}
      />

      <div className="main-content">
        <div className="content-wrapper">
          <div className="breadcrumb">
            <span 
              className="breadcrumb-link" 
              onClick={() => navigate('/admin-dashboard')}
            >
              Dashboard
            </span>
            <span className="breadcrumb-separator"> / </span>
            <span className="breadcrumb-current">Student Management</span>
          </div>
          
          <div className="dashboard-header">
            <h1 className="dashboard-welcome-title">Student Management</h1>
            {selectedProgram && selectedProgram !== 'All Programs' && (
              <div className="program-indicator">{selectedProgram}</div>
            )}
          </div>

          <div className="student-content-wrapper">
            {/* Program Navigation Card - Adapted from Course Management */}
            <div className="student-nav-section">
              <div className="student-nav-header">
                <h2 className="student-nav-title">Programs</h2>
              </div>
              <div className="student-nav-list">
                <div
                  className={`student-nav-item ${selectedProgram === 'All Programs' ? 'student-nav-item-active' : ''}`}
                  onClick={() => handleProgramSelect('All Programs')}
                >
                  <span className="student-nav-icon">📚</span>
                  All Programs
                </div>
                {programsList.map((program) => (
                  <div
                    key={program.programID}
                    className={`student-nav-item ${selectedProgram === program.programName ? 'student-nav-item-active' : ''}`}
                    onClick={() => handleProgramSelect(program.programName)}
                  >
                    <span className="student-nav-icon">📚</span>
                    {program.programName}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Student Management Section */}
            <div className="student-main-section">
              <div className="student-section-header">
                <h2 className="student-section-title">Students</h2>
                <p className="student-section-desc">Manage student records and information</p>
              </div>
              
              <div className="student-section-content">
                <div className="student-filters">
                  <div className="student-search-group">
                    <input
                      type="text"
                      className="form-input student-search-input"
                      placeholder="Search students by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="student-header-actions">
                    <button className="student-btn-add-student" onClick={showAddStudentForm}>
                      + Add New Student
                    </button>
                  </div>
                </div>

                <div className="student-table-container">
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Program</th>
                        <th>Year Level</th>
                        <th>Date of Birth</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id}>
                          <td className="student-id">{student.id}</td>
                          <td className="student-name">
                            {student.firstName} {student.lastName}
                          </td>
                          <td className="student-email">{student.email}</td>
                          <td>{student.program?.programName || 'No Program'}</td>
                          <td>Year {student.year_level}</td>
                          <td>{student.dateOfBirth}</td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn-action btn-edit"
                                onClick={() => showEditStudentForm(student)}
                                title="Edit Student"
                              >
                              </button>
                              <button 
                                className="btn-action btn-promote"
                                onClick={() => handlePromoteStudent(student.id)}
                                title="Promote Student"
                              >
                              </button>
                              <button 
                                className="btn-action btn-delete"
                                onClick={() => handleDeleteStudent(student.id)}
                                title="Delete Student"
                              >
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredStudents.length === 0 && (
                    <div className="no-students">
                      <p>No students found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Student</h2>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter first name"
                    value={studentForm.firstName}
                    onChange={(e) => handleStudentFormChange('firstName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter last name"
                    value={studentForm.lastName}
                    onChange={(e) => handleStudentFormChange('lastName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter email address"
                    value={studentForm.email}
                    onChange={(e) => handleStudentFormChange('email', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={studentForm.dateOfBirth}
                    onChange={(e) => handleStudentFormChange('dateOfBirth', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Year Level</label>
                  <select
                    className="form-input"
                    value={studentForm.year_level}
                    onChange={(e) => handleStudentFormChange('year_level', e.target.value)}
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Program</label>
                  <select
                    className="form-input"
                    value={studentForm.programId}
                    onChange={(e) => handleStudentFormChange('programId', e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programsList.map((program) => (
                      <option key={program.programID} value={program.programID}>
                        {program.programName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeAddStudentModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddStudent}>
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Student</h2>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter first name"
                    value={studentForm.firstName}
                    onChange={(e) => handleStudentFormChange('firstName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter last name"
                    value={studentForm.lastName}
                    onChange={(e) => handleStudentFormChange('lastName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter email address"
                    value={studentForm.email}
                    onChange={(e) => handleStudentFormChange('email', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={studentForm.dateOfBirth}
                    onChange={(e) => handleStudentFormChange('dateOfBirth', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Year Level</label>
                  <select
                    className="form-input"
                    value={studentForm.year_level}
                    onChange={(e) => handleStudentFormChange('year_level', e.target.value)}
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Program</label>
                  <select
                    className="form-input"
                    value={studentForm.programId}
                    onChange={(e) => handleStudentFormChange('programId', e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programsList.map((program) => (
                      <option key={program.programID} value={program.programID}>
                        {program.programName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeEditStudentModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEditStudent}>
                Update Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && generatedCredentials && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Student Account Created</h2>
              <button className="modal-close" onClick={() => setShowCredentialsModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="credentials-info">
                <p>Student account has been created successfully. Please save these credentials:</p>
                <div className="credentials-details">
                  <div className="credential-item">
                    <label>Username:</label>
                    <span className="credential-value">{generatedCredentials.username}</span>
                  </div>
                  <div className="credential-item">
                    <label>Password:</label>
                    <span className="credential-value">{generatedCredentials.password}</span>
                  </div>
                </div>
                <p className="credentials-note">
                  Note: These credentials will be shown only once. Please make sure to save them.
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-primary" 
                onClick={() => setShowCredentialsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
