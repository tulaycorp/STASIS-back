import React, { useState} from 'react';
import './CourseManagement.css';
import Sidebar from './Sidebar';
import ProgramSidebar from './ProgramSidebar';

const Course = () => {
  const [coursesData, setCoursesData] = useState([
    {
      id: 1,
      courseCode: 'CS101',
      courseName: 'Introduction to Computer Science',
      program: 'BS Computer Science',
      status: 'Active'
    },
    {
      id: 2,
      courseCode: 'IT201',
      courseName: 'Database Management Systems',
      program: 'BS Information Technology',
      status: 'Active'
    },
    {
      id: 3,
      courseCode: 'IS301',
      courseName: 'Systems Analysis and Design',
      program: 'BS Information Systems',
      status: 'Active'
    },
    {
      id: 4,
      courseCode: 'EMC401',
      courseName: '3D Animation and Modeling',
      program: 'BS Entertainment and Multimedia Computing',
      status: 'Inactive'
    }
  ]);

  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [selectedProgram, setSelectedProgram] = useState('BS Computer Science');
  const [editingCourse, setEditingCourse] = useState(null);
  
  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    courseName: '',
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
    const matchesSearch = course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.program.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by program
    const matchesProgram = selectedProgram === 'BS Computer Science' || course.program === selectedProgram;
    
    return matchesSearch && matchesProgram;
  });

  // Course Modal functions
  const showAddCourseForm = () => {
    setEditingCourse(null);
    setCourseForm({
      courseCode: '',
      courseName: '',
      program: '',
      status: 'Active'
    });
    setShowAddCourseModal(true);
  };

  const showEditCourseForm = (course) => {
    setEditingCourse(course);
    setCourseForm({
      courseCode: course.courseCode,
      courseName: course.courseName,
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
      courseName: '',
      program: '',
      status: 'Active'
    });
  };

  const closeEditCourseModal = () => {
    setShowEditCourseModal(false);
    setEditingCourse(null);
    setCourseForm({
      courseCode: '',
      courseName: '',
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

  const handleAddCourse = () => {
    // Validate required fields
    if (!courseForm.courseCode || !courseForm.courseName || !courseForm.program) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Check if course code already exists
    const existingCourse = coursesData.find(course => 
      course.courseCode.toLowerCase() === courseForm.courseCode.toLowerCase()
    );
    
    if (existingCourse) {
      alert('Course code already exists!');
      return;
    }
    
    // Create new course object
    const newCourse = {
      id: coursesData.length + 1,
      courseCode: courseForm.courseCode,
      courseName: courseForm.courseName,
      program: courseForm.program,
      status: courseForm.status
    };
    
    setCoursesData(prev => [...prev, newCourse]);
    alert('Course added successfully!');
    closeAddCourseModal();
  };

  const handleEditCourse = () => {
    // Validate required fields
    if (!courseForm.courseCode || !courseForm.courseName || !courseForm.program) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Check if course code already exists (excluding current course)
    const existingCourse = coursesData.find(course => 
      course.courseCode.toLowerCase() === courseForm.courseCode.toLowerCase() &&
      course.id !== editingCourse.id
    );
    
    if (existingCourse) {
      alert('Course code already exists!');
      return;
    }
    
    // Update course object
    const updatedCourse = {
      ...editingCourse,
      courseCode: courseForm.courseCode,
      courseName: courseForm.courseName,
      program: courseForm.program,
      status: courseForm.status
    };
    
    setCoursesData(prev => 
      prev.map(course => 
        course.id === editingCourse.id ? updatedCourse : course
      )
    );
    
    alert('Course updated successfully!');
    closeEditCourseModal();
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
  const showSection = (section) => {
    switch(section){
        case 'Dashboard':
            window.location.href = '/admin-dashboard';
                break;
        case 'Students':
            window.location.href = '/student-management';
                break;        case 'Curriculum':
            window.location.href = '/curriculum-management';
                break;
        case 'Schedule':
            window.location.href = '/schedule-management';
                break;
        case 'Faculty':
            window.location.href = '/faculty-management';
                break;
        default:
            alert(`${section.charAt(0).toUpperCase() + section.slice(1)} section would be displayed here.`);
    }
  };

  // Handle program selection
  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
    setSelectedSection('All Sections');
  };
  return (
    <div className="container">
      {/* Main Sidebar */}
      <Sidebar 
        activePage="Courses" 
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
              { id: 'Settings', label: 'Settings', icon: '⚙️', clickable: false },
              { id: 'AdminTools', label: 'Admin Tools', icon: '🔧', clickable: false }
            ]
          }
        ]}
      />      {/* Program Sidebar */}
      <ProgramSidebar
        programs={programs}
        selectedProgram={selectedProgram}
        onProgramSelect={handleProgramSelect}
        onAddSection={showAddSectionForm}
        totalCount={filteredCourses.length}
        countLabel="Courses"
      />

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-welcome-title">Course Management</h1>
          <div className="program-indicator">
            {selectedProgram}
          </div>
        </div>

        {/* Course Management Section */}
        <div className="dashboard-section-card">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Courses</h2>
            <div className="course-header-actions">
              <button className="btn btn-primary" onClick={showAddCourseForm}>
                Add Course
              </button>
            </div>
          </div>
          
          {/* Search Filter */}
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
          </div>

          {/* Courses Table */}
          <div className="course-table-container">
            <table className="course-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Program</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.id}>
                    <td className="course-code">{course.courseCode}</td>
                    <td className="course-name">{course.courseName}</td>
                    <td className="course-program">{course.program}</td>
                    <td>
                      <span className={`course-status ${course.status.toLowerCase()}`}>
                        {course.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-action"
                        onClick={() => showEditCourseForm(course)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredCourses.length === 0 && (
              <div className="no-courses">
                <p>No courses found matching your criteria.</p>
              </div>
            )}
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
                  <label className="form-label">Course Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Course Name"
                    value={courseForm.courseName}
                    onChange={(e) => handleCourseFormChange('courseName', e.target.value)}
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
        <div className="modal-overlay">
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
                  <label className="form-label">Course Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Course Name"
                    value={courseForm.courseName}
                    onChange={(e) => handleCourseFormChange('courseName', e.target.value)}
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
                
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={courseForm.status}
                    onChange={(e) => handleCourseFormChange('status', e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
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