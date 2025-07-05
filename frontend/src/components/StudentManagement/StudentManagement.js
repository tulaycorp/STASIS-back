import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentManagement.css';
import Sidebar from '../Sidebar';
import { useAdminData } from '../../hooks/useAdminData';
import { studentAPI, programAPI, courseSectionAPI, curriculumAPI, testConnection } from '../../services/api';
import Loading from '../Loading';

const StudentManagement = () => {
  const { getUserInfo } = useAdminData();
  const navigate = useNavigate();
  const [studentsData, setStudentsData] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [curriculumsList, setCurriculumsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [selectedProgram, setSelectedProgram] = useState('All Programs');
  const [selectedProgramSections, setSelectedProgramSections] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [availableSectionsForStudent, setAvailableSectionsForStudent] = useState([]);
  const [availableCurriculums, setAvailableCurriculums] = useState([]);
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
    programId: '',
    sectionId: '',
    curriculumId: ''
  });

  const studentFormInitialState = { 
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    year_level: 1,
    programId: '',
    sectionId: '',
    curriculumId: ''
  };

  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [toasts, setToasts] = useState([]);


  // Toast notification function
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };
  
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
      const [studentsResponse, programsResponse, sectionsResponse, curriculumResponse] = await Promise.all([
        studentAPI.getAllStudents(),
        programAPI.getAllPrograms(),
        courseSectionAPI.getAllSections(),
        curriculumAPI.getAllCurriculums()
      ]);

      setStudentsData(studentsResponse.data);
      setProgramsList(programsResponse.data);
      setSectionsList(sectionsResponse.data);
      setCurriculumsList(curriculumResponse.data);

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
    setStudentForm(studentFormInitialState); 
    setShowAddStudentModal(true);
  };


  const closeAddStudentModal = () => {
    setShowAddStudentModal(false);
    setStudentForm(studentFormInitialState);
  };

  const showEditStudentForm = (student) => {
  setEditingStudent(student);

  // Filter available curriculums and sections for the student's program when modal opens
  const programId = student.program?.programID?.toString() || '';
  
  if (programId) {
      // Set available curriculums
      const programCurriculums = curriculumsList.filter(c => c.program?.programID?.toString() === programId);
      setAvailableCurriculums(programCurriculums);
      
      // ✅ ADD THIS: Set available sections for the student's program
      const programSections = sectionsList.filter(section =>
        section.program?.programID?.toString() === programId ||
        section.programId?.toString() === programId
      );
      setAvailableSectionsForStudent(programSections);
  } else {
      setAvailableCurriculums([]);
      setAvailableSectionsForStudent([]); // ✅ ADD THIS: Reset sections when no program
  }

  setStudentForm({
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    email: student.email || '',
    dateOfBirth: student.dateOfBirth || '',
    year_level: student.year_level || 1,
    programId: programId,
    sectionId: student.section?.sectionID?.toString() || '',
    curriculumId: student.curriculum?.curriculumID?.toString() || '' 
  });
  setShowEditStudentModal(true);
};

  const closeEditStudentModal = () => {
    setShowEditStudentModal(false);
    setEditingStudent(null);
    setStudentForm(studentFormInitialState); 
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
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const selectedProgramObj = programsList.find(
        (p) => p.programID.toString() === sectionForm.programId
      );

      // Add a check in case the program isn't found (unlikely but good practice)
      if (!selectedProgramObj) {
        showToast('Could not find the selected program. Please refresh and try again.', 'error');
        return;
      }

      const sectionData = {
        sectionName: sectionForm.sectionName,
        program: selectedProgramObj,
        status: 'ACTIVE',
      };

      console.log("Sending this data to create section:", sectionData);
      await courseSectionAPI.createSection(sectionData);

      showToast('Section added successfully!', 'success');
      closeAddSectionModal(); // Close the modal
      loadInitialData();     // Reload all data to show the new section in the list

    } catch (error) {
      console.error('Error adding section:', error);
      if (error.response?.status === 409) { // 409 Conflict
        showToast('A section with this name already exists for the selected program.', 'error');
      } else if (error.response?.data?.message) {
        showToast(`Failed to add section: ${error.response.data.message}`, 'error');
      }
      else {
        showToast('Failed to add section. Please check the console for details.', 'error');
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
      showToast('Please select a section to delete', 'error');
      return;
    }

    if (window.confirm('Are you sure you want to delete this section? This action cannot be undone.')) {
      try {
        // Call API to delete section
        await courseSectionAPI.deleteSection(deleteSectionForm.sectionId);

        showToast('Section deleted successfully!', 'success');
        closeDeleteSectionModal();

        // Reload data to get the updated sections list
        loadInitialData();

      } catch (error) {
        console.error('Error deleting section:', error);
        if (error.response?.status === 404) {
          showToast('Section not found!', 'error');
        } else if (error.response?.status === 400) {
          showToast('Cannot delete section. It may have associated students.', 'error');
        } else {
          showToast('Failed to delete section. Please try again.', 'error');
        }
      }
    }
  };

  const handleAddStudent = async () => {
    // Validate required fields
    if (!studentForm.firstName || !studentForm.lastName || !studentForm.email || !studentForm.programId || !studentForm.curriculumId) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentForm.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      // Find the selected program object
      const selectedProgramObj = programsList.find(p => p.programID.toString() === studentForm.programId);
      const selectedSectionObj = sectionsList.find(s => s.sectionID.toString() === studentForm.sectionId);
      const selectedCurriculumObj = curriculumsList.find(c => c.curriculumID.toString() === studentForm.curriculumId);

      const studentData = {
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        email: studentForm.email,
        dateOfBirth: studentForm.dateOfBirth,
        year_level: parseInt(studentForm.year_level),
        program: selectedProgramObj || null,
        section: selectedSectionObj || null,
        curriculum: selectedCurriculumObj || null
      };

      // Await the API call and expect credentials in response
      const response = await studentAPI.createStudent(studentData);

      // If credentials are returned, show modal
      if (response.data && response.data.username && response.data.password) {
        setGeneratedCredentials({
          username: response.data.username,
          password: response.data.password
        });
        setShowCredentialsModal(true);
      } else {
        showToast('Student added successfully!', 'success');
      }

      closeAddStudentModal();
      loadInitialData(); // Reload student list
    } catch (error) {
      console.error('Error adding student:', error);
      if (error.response?.status === 400) {
        showToast('Email already exists or invalid data provided!', 'error');
      } else {
        showToast('Failed to add student. Please try again.', 'error');
      }
    }
  };

  const handleStudentProgramChange = (programId) => {
    handleStudentFormChange('programId', programId);
    handleStudentFormChange('sectionId', ''); // Reset section
    handleStudentFormChange('curriculumId', ''); // Reset curriculum

    // Filter sections for the selected program
    const programSections = sectionsList.filter(section =>
      section.program?.programID?.toString() === programId ||
      section.programId?.toString() === programId
    );
    setAvailableSectionsForStudent(programSections);

    const programCurriculums = curriculumsList.filter(curriculum => 
      curriculum.program?.programID?.toString() === programId
    );
    setAvailableCurriculums(programCurriculums);
  };


  const handleUpdateStudent = async () => {
    // Validate required fields
    if (!studentForm.firstName || !studentForm.lastName || !studentForm.email || !studentForm.programId || !studentForm.curriculumId) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentForm.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      // Find the selected program object
      const selectedProgramObj = programsList.find(p => p.programID.toString() === studentForm.programId);
      const selectedSectionObj = sectionsList.find(s => s.sectionID.toString() === studentForm.sectionId);
      const selectedCurriculumObj = curriculumsList.find(c => c.curriculumID.toString() === studentForm.curriculumId);

      const studentData = {
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        email: studentForm.email,
        dateOfBirth: studentForm.dateOfBirth,
        year_level: parseInt(studentForm.year_level),
        program: selectedProgramObj || null,
        section: selectedSectionObj || null,
        curriculum: selectedCurriculumObj || null
      };

      await studentAPI.updateStudent(editingStudent.id, studentData);
      showToast('Student updated successfully!', 'success');
      closeEditStudentModal();
      loadInitialData(); // Reload student list
    } catch (error) {
      console.error('Error updating student:', error);
      if (error.response?.status === 400) {
        // Check if the error message contains specific text
        const errorMessage = error.response?.data || 'Invalid data provided';
        if (typeof errorMessage === 'string' && errorMessage.includes('Email already exists')) {
          showToast('This email address is already in use by another student or faculty member.', 'error');
        } else {
          showToast('Invalid data provided. Please check your input.', 'error');
        }
      } else if (error.response?.status === 404) {
        showToast('Student not found!', 'error');
      } else {
        showToast('Failed to update student. Please try again.', 'error');
      }
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentAPI.deleteStudent(studentId);
        showToast('Student deleted successfully!', 'success');
        loadInitialData(); // Reload student list
      } catch (error) {
        console.error('Error deleting student:', error);
        if (error.response?.status === 404) {
          showToast('Student not found!', 'error');
        } else {
          showToast('Failed to delete student. Please try again.', 'error');
        }
      }
    }
  };

  const handlePromoteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to promote this student to the next year level?')) {
      try {
        await studentAPI.promoteStudent(studentId);
        showToast('Student promoted successfully!', 'success');
        loadInitialData(); // Reload student list
      } catch (error) {
        console.error('Error promoting student:', error);
        if (error.response?.status === 404) {
          showToast('Student not found!', 'error');
        } else {
          showToast('Failed to promote student. Please try again.', 'error');
        }
      }
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
        // setSelectedProgram(sectionProgram.program.programName);
      }
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Adjust as needed

  // Calculate pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const previousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Reset to first page when search/program/section changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedProgram, selectedSection]);

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar userInfo={getUserInfo()}/>
        <div className="main-content">
          <div className="content-wrapper">
            <Loading message="Loading students..." />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="dashboard-container">
        <Sidebar userInfo={getUserInfo()}/>
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
      {/* Toast Container */}
      <div id="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
      {/* Sidebar */}
      <Sidebar userInfo={getUserInfo()}/>
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
                        <th>Section</th>
                        <th>Year Level</th>
                        <th>Date of Birth</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStudents.map((student) => (
                        <tr key={student.id}>
                          <td className="student-id">{student.username || 'N/A'}</td>
                          <td className="student-name">
                            {student.firstName} {student.lastName}
                          </td>
                          <td className="student-email">{student.email}</td>
                          <td>{student.program?.programName || 'No Program'}</td>
                          <td>{student.section?.sectionName || student.sectionName || 'No Section'}</td>
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

                  {/* Pagination Controls - only show if there is data */}
                  {filteredStudents.length > 0 && (
                    <div className="pagination">
                      <div className="pagination-info">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} entries
                      </div>
                      <div className="pagination-controls">
                        <button className="page-btn" onClick={previousPage} disabled={currentPage === 1}>
                          Previous
                        </button>
                        {[...Array(Math.min(3, totalPages))].map((_, index) => {
                          const pageNum = index + 1;
                          return (
                            <button
                              key={pageNum}
                              className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                              onClick={() => goToPage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button className="page-btn" onClick={nextPage} disabled={currentPage === totalPages}>
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Add/Edit Student Modal */}
      {(showAddStudentModal || showEditStudentModal) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
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
                  <label className="form-label">Program *</label>
                  <select
                    className="form-input"
                    value={studentForm.programId}
                    onChange={(e) => handleStudentProgramChange(e.target.value)}
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
                  <label className="form-label">Curriculum *</label>
                  <select
                    className="form-input"
                    value={studentForm.curriculumId}
                    onChange={(e) => handleStudentFormChange('curriculumId', e.target.value)}
                    disabled={!studentForm.programId}
                  >
                    <option value="">Select Curriculum</option>
                    {availableCurriculums.map((curriculum) => (
                      <option key={curriculum.curriculumID} value={curriculum.curriculumID}>
                        {curriculum.curriculumName} ({curriculum.academicYear})
                      </option>
                    ))}
                  </select>
                  {studentForm.programId && availableCurriculums.length === 0 && (
                    <p style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px' }}>
                      No curriculums available for this program.
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select
                    className="form-input"
                    value={studentForm.sectionId}
                    onChange={(e) => handleStudentFormChange('sectionId', e.target.value)}
                    disabled={!studentForm.programId}
                  >
                    <option value="">Select Section</option>
                    {availableSectionsForStudent.map((section) => (
                      <option key={section.sectionID} value={section.sectionID}>
                        {section.sectionName}
                      </option>
                    ))}
                  </select>
                  {studentForm.programId && availableSectionsForStudent.length === 0 && (
                    <p style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px' }}>
                      No sections available for this program.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (editingStudent) {
                    closeEditStudentModal();
                  } else {
                    closeAddStudentModal();
                  }
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={editingStudent ? handleUpdateStudent : handleAddStudent}
              >
                {editingStudent ? 'Update Student' : 'Add Student'}
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

      {/* Credentials Modal */}
      {showCredentialsModal && generatedCredentials && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Student Account Created</h2>
              <button className="modal-close" onClick={() => setShowCredentialsModal(false)}>×</button>
            </div>
            
            <div className="modal-content">
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