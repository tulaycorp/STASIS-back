import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentManagement.css';
import Sidebar from './Sidebar';
import { useAdminData } from '../hooks/useAdminData';
import { studentAPI, programAPI, courseSectionAPI, testConnection } from '../services/api';

const StudentManagement = () => {
  const { getUserInfo } = useAdminData();
  const [studentsData, setStudentsData] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [selectedProgram, setSelectedProgram] = useState('All Programs');
  const [sectionsList, setSectionsList] = useState([]);
  const [selectedProgramSections, setSelectedProgramSections] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  // Removed tempSections state - no longer needed
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    sectionName: '',
    programId: ''
  });
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [deleteSectionForm, setDeleteSectionForm] = useState({
    programId: '',
    sectionId: ''
  });
  const [availableSectionsForDelete, setAvailableSectionsForDelete] = useState([]);

  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    year_level: 1,
    programId: ''
  });

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
      const [studentsResponse, programsResponse, sectionsResponse] = await Promise.all([
        studentAPI.getAllStudents(),
        programAPI.getAllPrograms(),
        courseSectionAPI.getAllSections()
      ]);

      setStudentsData(studentsResponse.data);
      setProgramsList(programsResponse.data);
      setSectionsList(sectionsResponse.data);

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

  // Filter students based on search term, selected program, and selected section
  const filteredStudents = studentsData.filter(student => {
    // Search term matching
    const matchesSearch =
      student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Program matching
    const matchesProgram = selectedProgram === 'All Programs' ||
      student.program?.programName === selectedProgram;

    // Section matching - Enhanced logic
    let matchesSection;
    if (selectedSection === 'All Sections') {
      matchesSection = true;
    } else {
      // Check if student belongs to the selected section
      matchesSection = student.section?.sectionName === selectedSection ||
        student.sectionName === selectedSection;

      // If no direct section match, check year level mapping
      if (!matchesSection && selectedSection.includes('Year')) {
        const yearNumber = selectedSection.replace('Year ', '');
        matchesSection = student.year_level?.toString() === yearNumber;
      }
    }

    return matchesSearch && matchesProgram && matchesSection;
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

  const showAddSectionForm = () => {
    setSectionForm({
      sectionName: '',
      programId: ''
    });
    setShowAddSectionModal(true);
  };

  const closeAddSectionModal = () => {
    setShowAddSectionModal(false);
    setSectionForm({
      sectionName: '',
      programId: ''
    });
  };

  const handleSectionFormChange = (field, value) => {
    setSectionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Updated handleAddSection to use API
  const handleAddSection = async () => {
    // Validate required fields
    if (!sectionForm.sectionName || !sectionForm.programId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Find the selected program
      const selectedProgramObj = programsList.find(p => p.programID.toString() === sectionForm.programId);

      // Create section data for API
      const sectionData = {
        sectionName: sectionForm.sectionName,
        program: selectedProgramObj,
        // Add any other required fields based on your backend model
        status: 'ACTIVE', // Assuming sections have a status
        // Add other fields as needed
      };

      // Call API to create section
      await courseSectionAPI.createSection(sectionData);
      
      alert('Section added successfully!');
      closeAddSectionModal();
      
      // Reload data to get the updated sections list
      loadInitialData();
      
    } catch (error) {
      console.error('Error adding section:', error);
      if (error.response?.status === 400) {
        alert('Invalid section data provided!');
      } else if (error.response?.status === 409) {
        alert('Section already exists!');
      } else {
        alert('Failed to add section. Please try again.');
      }
    }
  };

  const handleStudentFormChange = (field, value) => {
    setStudentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showDeleteSectionForm = () => {
    setDeleteSectionForm({
      programId: '',
      sectionId: ''
    });
    setAvailableSectionsForDelete([]);
    setShowDeleteSectionModal(true);
  };

  const closeDeleteSectionModal = () => {
    setShowDeleteSectionModal(false);
    setDeleteSectionForm({
      programId: '',
      sectionId: ''
    });
    setAvailableSectionsForDelete([]);
  };

  const handleDeleteSectionFormChange = (field, value) => {
    setDeleteSectionForm(prev => ({
      ...prev,
      [field]: value
    }));

    // When program is selected, filter sections for that program
    if (field === 'programId') {
      // Filter sections for the selected program
      const sectionsForProgram = sectionsList.filter(section =>
        section.program?.programID?.toString() === value ||
        section.programId?.toString() === value
      );
      
      setAvailableSectionsForDelete(sectionsForProgram);
      
      // Reset section selection when program changes
      setDeleteSectionForm(prev => ({
        ...prev,
        programId: value,
        sectionId: ''
      }));
    }
  };

  // Updated handleDeleteSection to use API only
  const handleDeleteSection = async () => {
    if (!deleteSectionForm.sectionId) {
      alert('Please select a section to delete');
      return;
    }

    if (window.confirm('Are you sure you want to delete this section? This action cannot be undone.')) {
      try {
        // Call API to delete section
        await courseSectionAPI.deleteSection(deleteSectionForm.sectionId);
        
        alert('Section deleted successfully!');
        closeDeleteSectionModal();
        
        // Reload data to get the updated sections list
        loadInitialData();
        
      } catch (error) {
        console.error('Error deleting section:', error);
        if (error.response?.status === 404) {
          alert('Section not found!');
        } else if (error.response?.status === 400) {
          alert('Cannot delete section. It may have associated students.');
        } else {
          alert('Failed to delete section. Please try again.');
        }
      }
    }
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

      await studentAPI.createStudent(studentData);
      alert('Student added successfully!');
      closeAddStudentModal();
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
    switch (section) {
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
    // Always reset to "All Sections" when changing programs
    setSelectedSection('All Sections');

    if (programName === 'All Programs') {
      // When "All Programs" is selected, we don't need to filter sections by program
      setSelectedProgramSections([]);
    } else {
      // Filter sections for the selected program (only from API data now)
      const programSections = sectionsList.filter(section =>
        section.programName === programName ||
        section.program?.programName === programName
      );
      setSelectedProgramSections(programSections);
    }
  };

  // Handle section selection with program context
  const handleSectionSelect = (sectionName) => {
    setSelectedSection(sectionName);

    // Optional: If a specific section is selected while "All Programs" is active,
    // you might want to automatically filter to show only the program that has this section
    if (selectedProgram === 'All Programs' && sectionName !== 'All Sections') {
      // Find which program this section belongs to
      const sectionProgram = sectionsList.find(section => section.sectionName === sectionName);
      if (sectionProgram && sectionProgram.program?.programName) {
        // Optionally auto-select the program (uncomment if desired)
        // setSelectedProgram(sectionProgram.program.programName);
      }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar
          onNavigate={showSection}
          userInfo={getUserInfo()}
          sections={
            [
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
                  { id: 'Settings', label: 'Settings', icon: '⚙️' },
                  { id: 'AdminTools', label: 'Admin Tools', icon: '🔧' }
                ]
              }
            ]
          }
        />
        <div className="main-content">
          <div className="content-wrapper">
            <div style={
              { padding: '2rem', textAlign: 'center' }}>
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
          userInfo={getUserInfo()}
          sections={
            [
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
                  { id: 'Settings', label: 'Settings', icon: '⚙️' },
                  { id: 'AdminTools', label: 'Admin Tools', icon: '🔧' }
                ]
              }
            ]
          }
        />
        <div className="main-content">
          <div className="content-wrapper">
            <div style={
              { padding: '2rem', textAlign: 'center' }}>
              <div className="error-container">
                <h3>Connection Error</h3>
                <p style={
                  { whiteSpace: 'pre-line', margin: '1rem 0' }}>{error}</p>
                <div style={
                  { marginTop: '1rem' }}>
                  <h4>Troubleshooting Steps:</h4>
                  <ol style={
                    { textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
                    <li>Check if Spring Boot is running: <code>http://localhost:8080</code></li>
                    <li>Check browser console for additional errors</li>
                    <li>Verify backend logs for any startup errors</li>
                    <li>Try accessing the API directly: <code>http://localhost:8080/api/students</code></li>
                  </ol>
                </div>
                <div style={
                  { display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                  <button onClick={loadInitialData}
                    className="btn btn-primary">
                    Retry Connection
                  </button>
                  <button onClick={
                    () => window.open('http://localhost:8080/api/students', '_blank')}
                    className="btn btn-secondary">
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
        userInfo={getUserInfo()}
        sections={
          [
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
                { id: 'Settings', label: 'Settings', icon: '⚙️' },
                { id: 'AdminTools', label: 'Admin Tools', icon: '🔧' }
              ]
            }
          ]
        }
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
            {/* Sidebar Container - NEW: Wraps both Programs and Sections */}
            <div className="student-sidebar">
              {/* Program Navigation Card */}
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

              <div className="student-nav-section">
                <div className="student-nav-header">
                  <h2 className="student-nav-title">Sections</h2>
                </div>
                <div className="student-nav-list">
                  <div
                    className={`student-nav-item ${selectedSection === 'All Sections' ? 'student-nav-item-active' : ''}`}
                    onClick={() => handleSectionSelect('All Sections')}
                  >
                    <span className="student-nav-icon">📋</span>
                    All Sections
                  </div>

                  {selectedProgram === 'All Programs'
                    ? // If "All Programs" is selected, show all sections from all programs
                    sectionsList.map((section) => (
                      <div
                        key={section.sectionID}
                        className={`student-nav-item ${selectedSection === section.sectionName ? 'student-nav-item-active' : ''}`}
                        onClick={() => handleSectionSelect(section.sectionName)}
                      >
                        <span className="student-nav-icon">📋</span>
                        {section.sectionName}
                        {/* Show program name for context */}
                        <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '4px' }}>
                          ({section.program?.programName || section.programName || 'No Program'})
                        </span>
                      </div>
                    ))
                    : // If specific program is selected, show only that program's sections
                    selectedProgramSections.map((section) => (
                      <div
                        key={section.sectionID}
                        className={`student-nav-item ${selectedSection === section.sectionName ? 'student-nav-item-active' : ''}`}
                        onClick={() => handleSectionSelect(section.sectionName)}
                      >
                        <span className="student-nav-icon">📋</span>
                        {section.sectionName}
                      </div>
                    ))
                  }
                </div>
                {/* Add Section Button */}
                <div className="add-section-container">
                  <button className="btn-add-section" onClick={showAddSectionForm}>
                    Add New Section
                  </button>
                  <button className="btn-delete-section" onClick={showDeleteSectionForm}>
                    Delete Section
                  </button>
                </div>
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
                        <th>Student Number</th>
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
                          <td className="student-id">{student.username || 'N/A'}</td>
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
                                className="btn-action btn-edit" // Edit Student
                                onClick={() => showEditStudentForm(student)}
                                title="Edit Student"
                              >
                              </button>
                              <button
                                className="btn-action btn-promote"
                                onClick={() => handlePromoteStudent(student.id)}
                                title="Promote Student"
                              >
                                ⬆️
                              </button>
                              <button // Delete Student
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

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Section</h2>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Section Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter section name (e.g., BSIT-1A, Year 1 - Section A)"
                    value={sectionForm.sectionName}
                    onChange={(e) => handleSectionFormChange('sectionName', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Program *</label>
                  <select
                    className="form-input"
                    value={sectionForm.programId}
                    onChange={(e) => handleSectionFormChange('programId', e.target.value)}
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
              <button className="btn btn-secondary" onClick={closeAddSectionModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddSection}>
                Add Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Section Modal */}
      {showDeleteSectionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Delete Section</h2>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Program *</label>
                  <select
                    className="form-input"
                    value={deleteSectionForm.programId}
                    onChange={(e) => handleDeleteSectionFormChange('programId', e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programsList.map((program) => (
                      <option key={program.programID} value={program.programID}>
                        {program.programName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Section *</label>
                  <select
                    className="form-input"
                    value={deleteSectionForm.sectionId}
                    onChange={(e) => handleDeleteSectionFormChange('sectionId', e.target.value)}
                    disabled={!deleteSectionForm.programId}
                  >
                    <option value="">Select Section</option>
                    {availableSectionsForDelete.map((section) => (
                      <option key={section.sectionID} value={section.sectionID}>
                        {section.sectionName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {deleteSectionForm.programId && availableSectionsForDelete.length === 0 && (
                <p style={{ color: '#6c757d', fontSize: '14px', marginTop: '10px' }}>
                  No sections found for this program.
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDeleteSectionModal}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleDeleteSection}
                disabled={!deleteSectionForm.sectionId}
              >
                Delete Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;