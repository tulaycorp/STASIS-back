import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CourseManagement.css';
import Sidebar from './Sidebar';
import { courseAPI, courseSectionAPI, testConnection } from '../services/api';

const Course = () => {
  const [coursesData, setCoursesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [selectedProgram, setSelectedProgram] = useState('BS Computer Science');
  const [editingCourse, setEditingCourse] = useState(null);
  
  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    courseDescription: '',
    credits: '',
    program: '',
    status: 'Active'
  });

  const [sectionForm, setSectionForm] = useState({
    program: '',
    yearLevel: '',
    sectionNumber: ''
  });

  // Available programs
  const programs = [
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
        return [...baseSections, 'CS 1st Year', 'CS 2nd Year', 'CS 3rd Year', 'CS 4th Year'];
      case 'BS Information Technology':
        return [...baseSections, 'IT 1st Year', 'IT 2nd Year', 'IT 3rd Year', 'IT 4th Year'];
      case 'BS Information Systems':
        return [...baseSections, 'IS 1st Year', 'IS 2nd Year', 'IS 3rd Year', 'IS 4th Year'];
      case 'BS Entertainment and Multimedia Computing':
        return [...baseSections, 'EMC 1st Year', 'EMC 2nd Year', 'EMC 3rd Year', 'EMC 4th Year'];
      default:
        return baseSections;
    }
  };

  const sections = getSectionsForProgram(selectedProgram);

  // Available curricula
  const curricula = [
    '2019-2020 Curriculum',
    '2020-2021 Curriculum',
    '2021-2022 Curriculum',
    '2022-2023 Curriculum'
  ];

  // Filter courses based on search and program
  const filteredCourses = coursesData.filter(course => {
    const matchesSearch = course.courseDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.program.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by program
    const matchesProgram = selectedProgram === 'BS Computer Science' || course.program === selectedProgram;
    
    return matchesSearch && matchesProgram;
  });

  // Load courses from API on component mount
  useEffect(() => {
    // Test connection first, then load courses
    testConnectionAndLoadCourses();
  }, []);

  const testConnectionAndLoadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Testing backend connection...');
      
      // First test the connection
      const connectionTest = await testConnection();
      
      if (!connectionTest.success) {
        throw new Error(`Connection failed: ${connectionTest.error} (Code: ${connectionTest.code})`);
      }
      
      console.log('Connection successful, loading courses...');
      await loadCourses();
      
    } catch (err) {
      console.error('Connection test or course loading failed:', err);
      handleConnectionError(err);
    }
  };

  const loadCourses = async () => {
    try {
      console.log('Attempting to load courses from API...');
      
      const response = await courseAPI.getAllCourses();
      console.log('API Response:', response.data);
      
      setCoursesData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading courses:', err);
      handleConnectionError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionError = (err) => {
    // Provide more specific error messages
    if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
      setError('Cannot connect to server. Please check:\n1. Backend is running on http://localhost:8080\n2. No firewall blocking the connection\n3. Backend started without errors');
    } else if (err.code === 'ECONNREFUSED') {
      setError('Connection refused. The backend server is not running on http://localhost:8080');
    } else if (err.response?.status === 404) {
      setError('API endpoint not found. Please check if the CourseController is properly configured.');
    } else if (err.response?.status === 500) {
      setError('Server error. Please check the backend console for error details.');
    } else if (err.response?.status === 0) {
      setError('Network error. This might be a CORS issue or the server is not responding.');
    } else {
      setError(`Failed to load courses: ${err.response?.data?.message || err.message}`);
    }
  };

  // Course Modal functions
  const showAddCourseForm = () => {
    setEditingCourse(null);
    setCourseForm({
      courseCode: '',
      courseDescription: '',
      credits: '',
      program: '',
      status: 'Active'
    });
    setShowAddCourseModal(true);
  };

  const showEditCourseForm = (course) => {
    setEditingCourse(course);
    setCourseForm({
      courseCode: course.courseCode,
      courseDescription: course.courseDescription,
      credits: course.credits,
      program: course.program,
      status: course.status
    });
    setShowEditCourseModal(true);
  };

  const closeAddCourseModal = () => {
    setShowAddCourseModal(false);
    setEditingCourse(null);
    setCourseForm({
      courseCode: '',
      courseDescription: '',
      credits: '',
      program: '',
      status: 'Active'
    });
  };

  const closeEditCourseModal = () => {
    setShowEditCourseModal(false);
    setEditingCourse(null);
    setCourseForm({
      courseCode: '',
      courseDescription: '',
      credits: '',
      program: '',
      status: 'Active'
    });
  };

  const handleCourseFormChange = (field, value) => {
    setCourseForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCourse = async () => {
    // Validate required fields
    if (!courseForm.courseCode || !courseForm.courseDescription || !courseForm.credits || !courseForm.program) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Validate credits is a positive number
    if (isNaN(courseForm.credits) || courseForm.credits <= 0) {
      alert('Credits must be a positive number');
      return;
    }
    
    try {
      const courseData = {
        courseCode: courseForm.courseCode,
        courseDescription: courseForm.courseDescription,
        credits: parseInt(courseForm.credits),
        program: courseForm.program
        // Note: removed 'status' field as it's not in the Course model
      };

      console.log('Creating course:', courseData);
      await courseAPI.createCourse(courseData);
      alert('Course added successfully!');
      closeAddCourseModal();
      loadCourses(); // Reload courses list
    } catch (error) {
      console.error('Error adding course:', error);
      if (error.response?.status === 400) {
        alert('Course code already exists or invalid data provided!');
      } else {
        alert('Failed to add course. Please try again.');
      }
    }
  };

  const handleEditCourse = async () => {
    // Validate required fields
    if (!courseForm.courseCode || !courseForm.courseDescription || !courseForm.credits || !courseForm.program) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Validate credits is a positive number
    if (isNaN(courseForm.credits) || courseForm.credits <= 0) {
      alert('Credits must be a positive number');
      return;
    }
    
    try {
      const courseData = {
        courseCode: courseForm.courseCode,
        courseDescription: courseForm.courseDescription,
        credits: parseInt(courseForm.credits),
        program: courseForm.program
      };

      await courseAPI.updateCourse(editingCourse.id, courseData);
      alert('Course updated successfully!');
      closeEditCourseModal();
      loadCourses(); // Reload courses list
    } catch (error) {
      console.error('Error updating course:', error);
      if (error.response?.status === 400) {
        alert('Course code already exists or invalid data provided!');
      } else if (error.response?.status === 404) {
        alert('Course not found!');
      } else {
        alert('Failed to update course. Please try again.');
      }
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await courseAPI.deleteCourse(courseId);
        alert('Course deleted successfully!');
        loadCourses(); // Reload courses list
      } catch (error) {
        console.error('Error deleting course:', error);
        if (error.response?.status === 404) {
          alert('Course not found!');
        } else {
          alert('Failed to delete course. Please try again.');
        }
      }
    }
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

  const handleAddSection = async () => {
    // Validate required fields
    if (!sectionForm.program || !sectionForm.yearLevel || !sectionForm.sectionNumber) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      const sectionData = {
        program: sectionForm.program,
        yearLevel: sectionForm.yearLevel,
        sectionNumber: sectionForm.sectionNumber,
        // Add other required fields based on your CourseSection model
      };

      await courseSectionAPI.createSection(sectionData);
      alert(`Section "${sectionForm.program} ${sectionForm.yearLevel}-${sectionForm.sectionNumber}" created successfully!`);
      closeAddSectionModal();
    } catch (error) {
      console.error('Error adding section:', error);
      alert('Failed to create section. Please try again.');
    }
  };
  // Navigation
  const navigate = useNavigate();
  const showSection = (section) => {
    switch(section){
        case 'Dashboard':
            navigate('/admin-dashboard');
            break;
        case 'Students':
            navigate('/student-management');
            break;        
        case 'Curriculum':
            navigate('/curriculum-management');
            break;
        case 'Schedule':
            navigate('/schedule-management');
            break;
        case 'Faculty':
            navigate('/faculty-management');
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
  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
    setSelectedSection('All Sections');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container">
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
              <p>Loading courses...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container">
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
              <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
                <h3>Error Loading Courses</h3>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '1rem', 
                  borderRadius: '4px', 
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap',
                  fontSize: '14px'
                }}>
                  {error}
                </pre>
                <div style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
                  <p><strong>Troubleshooting steps:</strong></p>
                  <ol style={{ textAlign: 'left', display: 'inline-block' }}>
                    <li>Check if Spring Boot is running: <code>http://localhost:8080</code></li>
                    <li>Check browser console for additional errors</li>
                    <li>Verify backend logs for any startup errors</li>
                    <li>Try accessing the API directly: <code>http://localhost:8080/api/courses</code></li>
                  </ol>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button onClick={testConnectionAndLoadCourses} className="btn btn-primary">
                  Retry Connection
                </button>
                <button 
                  onClick={() => window.open('http://localhost:8080/api/courses', '_blank')} 
                  className="btn btn-secondary"
                >
                  Test API Directly
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="container">
    {/* Main Sidebar */}
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
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span 
            className="breadcrumb-link" 
            onClick={() => navigate('/admin-dashboard')}
          >
            Dashboard
          </span>
          <span className="breadcrumb-separator"> / </span>
          <span className="breadcrumb-current">Course Management</span>
        </div>
        
        <div className="dashboard-header">
          <h1 className="dashboard-welcome-title">Course Management</h1>
          <div className="program-indicator">
            {selectedProgram}
          </div>
        </div>

        <div className="course-content-wrapper">
          {/* Program Selection Card */}
          <div className="course-nav-section">
            <div className="course-nav-header">
              <h2 className="course-nav-title">Programs</h2>
            </div>
            <div className="course-nav-list">
              {programs.map((program) => (
                <div
                  key={program}
                  className={`course-nav-item ${selectedProgram === program ? 'course-nav-item-active' : ''}`}
                  onClick={() => handleProgramSelect(program)}
                >
                  <span className="course-nav-icon">📚</span>
                  {program}
                </div>
              ))}
            </div>
            <div className="course-nav-actions">
              <button className="course-btn-add-section" onClick={showAddSectionForm}>
                Add New Section
              </button>
            </div>
            <div className="course-nav-info">
              <div className="course-nav-info-item">
                <div className="course-nav-info-label">{selectedProgram}</div>
                <div className="course-nav-info-value">Total Courses: {filteredCourses.length}</div>
              </div>
            </div>
          </div>

          {/* Course Management Section Card */}
          <div className="course-main-section">
            <div className="course-section-header">
              <h2 className="course-section-title">Courses</h2>
              <p className="course-section-desc">Manage course records and information</p>
            </div>
            
            <div className="course-section-content">
              {/* Filters */}
              <div className="course-filters">
                <div className="course-search-group">
                  <input
                    type="text"
                    className="form-input course-search-input"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="course-header-actions">
                  <button className="course-btn-add-course" onClick={showAddCourseForm}>
                    + Add New Course
                  </button>
                </div>
              </div>

              {/* Courses Table */}
              <div className="course-table-container">
                <table className="course-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Description</th>
                      <th>Credits</th>
                      <th>Program</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((course) => (
                      <tr key={course.id}>
                        <td className="course-code">{course.courseCode}</td>
                        <td className="course-description">{course.courseDescription}</td>
                        <td className="course-credits">{course.credits}</td>
                        <td className="course-program">{course.program}</td>
                        <td>
                          <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn-action btn-edit"
                              onClick={() => showEditCourseForm(course)}
                              title="Edit Course"
                              style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              className="btn-action btn-delete"
                              onClick={() => handleDeleteCourse(course.id)}
                              title="Delete Course"
                              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredCourses.length === 0 && (
                  <div className="no-courses" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>No courses found matching your criteria.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Add Course Modal */}
    {showAddCourseModal && (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">Add New Course</h2>
          </div>
          
          <div className="modal-body">
            <div className="modal-grid">
              <div className="form-group">
                <label className="form-label">Course Code *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter Course Code (e.g., CS101)"
                  value={courseForm.courseCode}
                  onChange={(e) => handleCourseFormChange('courseCode', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Course Description *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter Course Description"
                  value={courseForm.courseDescription}
                  onChange={(e) => handleCourseFormChange('courseDescription', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Credits *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter number of credits"
                  min="1"
                  max="6"
                  value={courseForm.credits}
                  onChange={(e) => handleCourseFormChange('credits', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Program *</label>
                <select
                  className="form-input"
                  value={courseForm.program}
                  onChange={(e) => handleCourseFormChange('program', e.target.value)}
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
            <button className="btn btn-secondary" onClick={closeAddCourseModal}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddCourse}>
              Add Course
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Edit Course Modal */}
    {showEditCourseModal && (
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Edit Course</h2>
        </div>
        
        <div className="modal-body">
          <div className="modal-grid">
            <div className="form-group">
              <label className="form-label">Course Code *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter Course Code (e.g., CS101)"
                value={courseForm.courseCode}
                onChange={(e) => handleCourseFormChange('courseCode', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Course Description *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter Course Description"
                value={courseForm.courseDescription}
                onChange={(e) => handleCourseFormChange('courseDescription', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Credits *</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter number of credits"
                min="1"
                max="6"
                value={courseForm.credits}
                onChange={(e) => handleCourseFormChange('credits', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Program *</label>
              <select
                className="form-input"
                value={courseForm.program}
                onChange={(e) => handleCourseFormChange('program', e.target.value)}
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
          <button className="btn btn-secondary" onClick={closeEditCourseModal}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleEditCourse}>
            Update Course
          </button>
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

export default Course;