import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentManagement.css';
import Sidebar from './Sidebar';

const Student = () => {
  const [studentsData, setStudentsData] = useState([
    {
      id: 1,
      studentId: '2019-0001',
      name: 'Christopher Mitchell',
      email: 'christopher.mitchell@example.com',
      birthday: 'March 15, 2001',
      section: 'BSIT 2-2',
      program: '2019-2020 Curriculum',
      status: 'Active'
    },
    {
      id: 2,
      studentId: '2019-0002',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      birthday: 'July 22, 2000',
      section: 'BSIT 2-1',
      program: '2019-2020 Curriculum',
      status: 'Active'
    },
    {
      id: 3,
      studentId: '2019-0003',
      name: 'Michael Brown',
      email: 'michael.brown@example.com',
      birthday: 'December 8, 2001',
      section: 'BSIT 2-2',
      program: '2019-2020 Curriculum',
      status: 'Inactive'
    }
  ]);

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [selectedProgram, setSelectedCourse] = useState('BS Computer Science');
  const [editingStudent, setEditingStudent] = useState(null);
  
  const [studentForm, setStudentForm] = useState({
    studentId: '',
    email: '',
    firstName: '',
    lastName: '',
    middleName: '',
    birthday: '',
    section: '',
    program: '',
    status: 'Active'
  });

  const [sectionForm, setSectionForm] = useState({
    program: '',
    yearLevel: '',
    sectionNumber: ''
  });

  // Available courses
  const courses = [
    'BS Computer Science',
    'BS Information Technology',
    'BS Information Systems',
    'BS Entertainment and Multimedia Computing'
  ];

  // Available sections based on selected program
  const getSectionsForProgram = (program) => {
    const baseSections = ['All Sections'];
    switch(program) {
      case 'BS Computer Science':
        return [...baseSections];
      case 'BS Information Technology':
        return [...baseSections];
      case 'BS Information Systems':
        return [...baseSections];
      case 'BS Entertainment and Multimedia Computing':
        return [...baseSections];
      default:
        return baseSections;
    }
  };

  const sections = getSectionsForProgram(selectedProgram);

  // Available programs
  const programs = [
    '2019-2020 Curriculum',
    '2020-2021 Curriculum',
    '2021-2022 Curriculum',
    '2022-2023 Curriculum'
  ];

  // Filter students based on search, section, and program
  const filteredStudents = studentsData.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = selectedSection === 'All Sections' || student.section === selectedSection;
    
    // Filter by program based on section prefix
    let matchesCourse = true;
    if (selectedProgram !== 'BS Computer Science') {
      const programPrefix = selectedProgram.includes('Information Technology') ? 'BSIT' :
                          selectedProgram.includes('Information Systems') ? 'BSIS' :
                          selectedProgram.includes('Entertainment') ? 'BSEMC' : 'BSCS';
      matchesCourse = student.section.startsWith(programPrefix);
    }
    
    return matchesSearch && matchesSection && matchesCourse;
  });

  // Helper function to parse full name into parts
  const parseFullName = (fullName) => {
    const nameParts = fullName.split(' ');
    if (nameParts.length === 2) {
      return {
        firstName: nameParts[0],
        middleName: '',
        lastName: nameParts[1]
      };
    } else if (nameParts.length === 3) {
      return {
        firstName: nameParts[0],
        middleName: nameParts[1],
        lastName: nameParts[2]
      };
    } else if (nameParts.length > 3) {
      return {
        firstName: nameParts[0],
        middleName: nameParts.slice(1, -1).join(' '),
        lastName: nameParts[nameParts.length - 1]
      };
    } else {
      return {
        firstName: fullName,
        middleName: '',
        lastName: ''
      };
    }
  };

  // Helper function to format date for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    // Handle different date formats
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    // Try to parse manually for formats like "March 15, 2001"
    const monthNames = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };
    
    const parts = dateString.toLowerCase().replace(',', '').split(' ');
    if (parts.length === 3) {
      const month = monthNames[parts[0]];
      const day = parts[1].padStart(2, '0');
      const year = parts[2];
      if (month && day && year) {
        return `${year}-${month}-${day}`;
      }
    }
    
    return '';
  };

  // Student Modal functions
  const showAddStudentForm = () => {
    setEditingStudent(null);
    setStudentForm({
      studentId: '',
      email: '',
      firstName: '',
      lastName: '',
      middleName: '',
      birthday: '',
      section: '',
      program: '',
      status: 'Active'
    });
    setShowAddStudentModal(true);
  };

  const showEditStudentForm = (student) => {
    const nameParts = parseFullName(student.name);
    setEditingStudent(student);
    setStudentForm({
      studentId: student.studentId,
      email: student.email,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      middleName: nameParts.middleName,
      birthday: formatDateForInput(student.birthday),
      section: student.section,
      program: student.program,
      status: student.status
    });
    setShowEditStudentModal(true);
  };

  const closeAddStudentModal = () => {
    setShowAddStudentModal(false);
    setEditingStudent(null);
    setStudentForm({
      studentId: '',
      email: '',
      firstName: '',
      lastName: '',
      middleName: '',
      birthday: '',
      section: '',
      program: '',
      status: 'Active'
    });
  };

  const closeEditStudentModal = () => {
    setShowEditStudentModal(false);
    setEditingStudent(null);
    setStudentForm({
      studentId: '',
      email: '',
      firstName: '',
      lastName: '',
      middleName: '',
      birthday: '',
      section: '',
      program: '',
      status: 'Active'
    });
  };

  const handleStudentFormChange = (field, value) => {
    setStudentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddStudent = () => {
    // Validate required fields
    if (!studentForm.studentId || !studentForm.email || !studentForm.firstName || !studentForm.lastName) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Create new student object
    const newStudent = {
      id: studentsData.length + 1,
      studentId: studentForm.studentId,
      name: `${studentForm.firstName} ${studentForm.middleName ? studentForm.middleName + ' ' : ''}${studentForm.lastName}`,
      email: studentForm.email,
      birthday: studentForm.birthday,
      section: studentForm.section,
      program: studentForm.program,
      status: studentForm.status
    };
    
    setStudentsData(prev => [...prev, newStudent]);
    alert('Student added successfully!');
    closeAddStudentModal();
  };

  const handleEditStudent = () => {
    // Validate required fields
    if (!studentForm.studentId || !studentForm.email || !studentForm.firstName || !studentForm.lastName) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Update student object
    const updatedStudent = {
      ...editingStudent,
      studentId: studentForm.studentId,
      name: `${studentForm.firstName} ${studentForm.middleName ? studentForm.middleName + ' ' : ''}${studentForm.lastName}`,
      email: studentForm.email,
      birthday: studentForm.birthday,
      section: studentForm.section,
      program: studentForm.program,
      status: studentForm.status
    };
    
    setStudentsData(prev => 
      prev.map(student => 
        student.id === editingStudent.id ? updatedStudent : student
      )
    );
    
    alert('Student updated successfully!');
    closeEditStudentModal();
  };

  // Section Modal functions
  const showAddSectionForm = () => {
    setShowAddSectionModal(true);
  };

  const closeAddSectionModal = () => {
    setShowAddSectionModal(false);
    setSectionForm({
      program: '',
      yearLevel: '',
      sectionNumber: ''
    });
  };

  const handleSectionFormChange = (field, value) => {
    setSectionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSection = () => {
    // Validate required fields
    if (!sectionForm.program || !sectionForm.yearLevel || !sectionForm.sectionNumber) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Create new section name
    const newSectionName = `${sectionForm.program} ${sectionForm.yearLevel}-${sectionForm.sectionNumber}`;
    
    // Check if section already exists
    if (sections.includes(newSectionName)) {
      alert('Section already exists!');
      return;
    }
    
    alert(`Section "${newSectionName}" created successfully!`);
    closeAddSectionModal();
  };

  // Navigation
  const navigate = useNavigate();  const showSection = (section) => {
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
  const handleCourseSelect = (program) => {
    setSelectedCourse(program);
    setSelectedSection('All Sections');
  };
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

      {/* Main Content with Card Layout */}
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
            <div className="program-indicator">
              {selectedProgram}
            </div>
          </div>

          <div className="student-content-wrapper">
            {/* Program Selection Card */}
            <div className="student-nav-section">
              <div className="student-nav-header">
                <h2 className="student-nav-title">Programs</h2>
              </div>
              <div className="student-nav-list">
                {courses.map((program) => (
                  <div
                    key={program}
                    className={`student-nav-item ${selectedProgram === program ? 'student-nav-item-active' : ''}`}
                    onClick={() => handleCourseSelect(program)}
                  >
                    <span className="student-nav-icon">📚</span>
                    {program}
                  </div>
                ))}
              </div>
              <div className="student-nav-actions">
                <button className="student-btn-add-section" onClick={showAddSectionForm}>
                  Add New Section
                </button>
              </div>
              <div className="student-nav-info">
                <div className="student-nav-info-item">
                  <div className="student-nav-info-label">{selectedProgram}</div>
                  <div className="student-nav-info-value">Total Students: {filteredStudents.length}</div>
                </div>
              </div>
            </div>

            {/* Student Management Section Card */}
            <div className="student-main-section">
              <div className="student-section-header">
                <h2 className="student-section-title">Students</h2>
                <p className="student-section-desc">Manage student records and information</p>
              </div>
              
              <div className="student-section-content">
                {/* Filters */}
                <div className="student-filters">
                  <div className="student-search-group">
                    <input
                      type="text"
                      className="form-input student-search-input"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="student-filter-group">
                    <select
                      className="form-input"
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                    >
                      <option value="All Sections">All Sections</option>
                      {sections.map((section) => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>
                  <div className="student-header-actions">
                    <button className="btn-add-student" onClick={showAddStudentForm}>
                      + Add New Student
                    </button>
                  </div>
                </div>

                {/* Student Table */}
                <div className="student-table-container">
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Birthday</th>
                        <th>Section</th>
                        <th>Program</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="no-students">
                            No students found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student) => (
                          <tr key={student.id}>
                            <td className="student-id">{student.studentId}</td>
                            <td className="student-name">{student.name}</td>
                            <td className="student-email">{student.email}</td>
                            <td>{student.birthday}</td>
                            <td>{student.section}</td>
                            <td>{student.program}</td>
                            <td>
                              <span className={`student-status ${student.status.toLowerCase()}`}>
                                {student.status}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn-action"
                                onClick={() => showEditStudentForm(student)}
                              >
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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
                  <label className="form-label">Student ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Student ID"
                    value={studentForm.studentId}
                    onChange={(e) => handleStudentFormChange('studentId', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter Student Email"
                    value={studentForm.email}
                    onChange={(e) => handleStudentFormChange('email', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter First Name"
                    value={studentForm.firstName}
                    onChange={(e) => handleStudentFormChange('firstName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Last Name"
                    value={studentForm.lastName}
                    onChange={(e) => handleStudentFormChange('lastName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Middle Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Middle Name"
                    value={studentForm.middleName}
                    onChange={(e) => handleStudentFormChange('middleName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Birthday</label>
                  <input
                    type="date"
                    className="form-input"
                    value={studentForm.birthday}
                    onChange={(e) => handleStudentFormChange('birthday', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select
                    className="form-input"
                    value={studentForm.section}
                    onChange={(e) => handleStudentFormChange('section', e.target.value)}
                  >
                    <option value="">Select Section</option>
                    {sections.slice(1).map((section) => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Program</label>
                  <select
                    className="form-input"
                    value={studentForm.program}
                    onChange={(e) => handleStudentFormChange('program', e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programs.map((program) => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeAddStudentModal}>
                Cancel
              </button>
              <button className="btn-add-student" onClick={handleAddStudent}>
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
                  <label className="form-label">Student ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Student ID"
                    value={studentForm.studentId}
                    onChange={(e) => handleStudentFormChange('studentId', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter Student Email"
                    value={studentForm.email}
                    onChange={(e) => handleStudentFormChange('email', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter First Name"
                    value={studentForm.firstName}
                    onChange={(e) => handleStudentFormChange('firstName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Last Name"
                    value={studentForm.lastName}
                    onChange={(e) => handleStudentFormChange('lastName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Middle Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Middle Name"
                    value={studentForm.middleName}
                    onChange={(e) => handleStudentFormChange('middleName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Birthday</label>
                  <input
                    type="date"
                    className="form-input"
                    value={studentForm.birthday}
                    onChange={(e) => handleStudentFormChange('birthday', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select
                    className="form-input"
                    value={studentForm.section}
                    onChange={(e) => handleStudentFormChange('section', e.target.value)}
                  >
                    <option value="">Select Section</option>
                    {sections.slice(1).map((section) => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Program</label>
                  <select
                    className="form-input"
                    value={studentForm.program}
                    onChange={(e) => handleStudentFormChange('program', e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programs.map((program) => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={studentForm.status}
                    onChange={(e) => handleStudentFormChange('status', e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
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
              <div className="form-group">
                <label className="form-label">Program *</label>
                <select
                  className="form-input"
                  value={sectionForm.program}
                  onChange={(e) => handleSectionFormChange('program', e.target.value)}
                >
                  <option value="">Select Program</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSIS">BSIS</option>
                  <option value="BSEMC">BSEMC</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Year Level *</label>
                <select
                  className="form-input"
                  value={sectionForm.yearLevel}
                  onChange={(e) => handleSectionFormChange('yearLevel', e.target.value)}
                >
                  <option value="">Select Year Level</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Section Number *</label>
                <select
                  className="form-input"
                  value={sectionForm.sectionNumber}
                  onChange={(e) => handleSectionFormChange('sectionNumber', e.target.value)}
                >
                  <option value="">Select Section Number</option>
                  <option value="1">Section 1</option>
                  <option value="2">Section 2</option>
                  <option value="3">Section 3</option>
                  <option value="4">Section 4</option>
                  <option value="5">Section 5</option>
                </select>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeAddSectionModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddSection}>
                Create Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Student;