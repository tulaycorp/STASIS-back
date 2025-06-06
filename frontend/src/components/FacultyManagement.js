import React, { useState } from 'react';
import './FacultyManagement.css';

const FacultyManagement = () => {
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [facultyForm, setFacultyForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    employmentStatus: ''
  });

  // Sample faculty data
  const [facultyList, setFacultyList] = useState([
    {
      id: 'FAC001',
      name: 'Emily Thompson',
      position: 'Associate Professor',
      department: 'Computer Science',
      email: 'emily.thompson@university.edu',
      status: 'Full-time'
    },
    {
      id: 'FAC002',
      name: 'James Chen',
      position: 'Professor',
      department: 'Information Technology',
      email: 'james.chen@university.edu',
      status: 'Full-time'
    },
    {
      id: 'FAC003',
      name: 'Sarah Martinez',
      position: 'Assistant Professor',
      department: 'Business Administration',
      email: 'sarah.martinez@university.edu',
      status: 'Part-time'
    },
    {
      id: 'FAC004',
      name: 'Michael Roberts',
      position: 'Professor',
      department: 'Engineering',
      email: 'michael.roberts@university.edu',
      status: 'Full-time'
    },
    {
      id: 'FAC005',
      name: 'Rachel Williams',
      position: 'Associate Professor',
      department: 'Psychology',
      email: 'rachel.williams@university.edu',
      status: 'Part-time'
    }
  ]);

  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [searchTerm, setSearchTerm] = useState('');

  // Department options for faculty
  const departmentOptions = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'History',
    'Psychology',
    'Business Administration',
    'Engineering',
    'Information Technology'
  ];

  // Position options for faculty
  const positionOptions = [
    'Professor',
    'Associate Professor',
    'Assistant Professor',
    'Lecturer',
    'Instructor',
    'Department Head',
    'Dean'
  ];

  // Employment status options
  const employmentStatusOptions = [
    'Full-time',
    'Part-time',
    'Contract',
    'Adjunct'
  ];

  // Statistics calculations
  const totalFaculty = facultyList.length;
  const fullTimeFaculty = facultyList.filter(f => f.status === 'Full-time').length;
  const partTimeFaculty = facultyList.filter(f => f.status === 'Part-time').length;
  const departments = [...new Set(facultyList.map(f => f.department))].length;

  // Filter faculty based on search and department
  const filteredFaculty = facultyList.filter(faculty => {
    const matchesSearch = faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faculty.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All Departments' || faculty.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Faculty Modal functions
  const showAddFacultyForm = () => {
    setShowAddFacultyModal(true);
  };

  const closeAddFacultyModal = () => {
    setShowAddFacultyModal(false);
    setFacultyForm({
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      position: '',
      employmentStatus: ''
    });
  };

  const handleFacultyFormChange = (field, value) => {
    setFacultyForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddFaculty = () => {
    // Validate required fields
    if (!facultyForm.firstName || !facultyForm.lastName || !facultyForm.email || !facultyForm.department) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Generate new faculty ID
    const newId = `FAC${String(facultyList.length + 1).padStart(3, '0')}`;
    
    // Create new faculty object
    const newFaculty = {
      id: newId,
      name: `${facultyForm.firstName} ${facultyForm.lastName}`,
      position: facultyForm.position || 'Assistant Professor',
      department: facultyForm.department,
      email: facultyForm.email,
      status: facultyForm.employmentStatus || 'Full-time'
    };
    
    // Add to faculty list
    setFacultyList(prev => [...prev, newFaculty]);
    
    alert('Faculty added successfully!');
    closeAddFacultyModal();
  };

  return (
    <div className="faculty-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            📊
          </div>
        </div>
        
        <div className="sidebar-content">
          <div className="nav-section">
            <div className="nav-item active">Dashboard</div>
          </div>
          
          <div className="nav-section">
            <div className="nav-label">Management</div>
            <div className="nav-items">
              <div className="nav-item">Students</div>
              <div className="nav-item">Curriculum</div>
              <div className="nav-item">Schedule</div>
              <div className="nav-item active-page">Faculty</div>
              <div className="nav-item">Courses</div>
            </div>
          </div>
          
          <div className="nav-section">
            <div className="nav-label">System</div>
            <div className="nav-items">
              <div className="nav-item">Settings</div>
              <div className="nav-item">Admin Tools</div>
            </div>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <div className="user-name">David Anderson</div>
          <div className="user-role">Faculty Admin</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            Home > Faculty
          </div>
          
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">Faculty Management</h1>
            <button 
              onClick={showAddFacultyForm}
              className="btn btn-primary"
            >
              + Add New Faculty
            </button>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Faculty</div>
              <div className="stat-value">{totalFaculty}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Full-time</div>
              <div className="stat-value">{fullTimeFaculty}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Part-time</div>
              <div className="stat-value">{partTimeFaculty}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Departments</div>
              <div className="stat-value">{departments}</div>
            </div>
          </div>

          {/* Faculty List */}
          <div className="faculty-list-container">
            <div className="list-header">
              <div className="list-controls">
                <h2 className="list-title">Faculty List</h2>
                <div className="controls">
                  <select 
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="select-input"
                  >
                    <option>All Departments</option>
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Search faculty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="faculty-table">
                <thead>
                  <tr>
                    <th>Faculty ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculty.map((faculty, index) => (
                    <tr key={faculty.id}>
                      <td>{faculty.id}</td>
                      <td>
                        <div className="faculty-info">
                          <div className="faculty-name">{faculty.name}</div>
                          <div className="faculty-position">{faculty.position}</div>
                        </div>
                      </td>
                      <td>{faculty.department}</td>
                      <td>{faculty.email}</td>
                      <td>
                        <span className={`status-badge ${faculty.status === 'Full-time' ? 'status-fulltime' : 'status-parttime'}`}>
                          {faculty.status}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <button className="btn-edit">Edit</button>
                        <button className="btn-delete">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <div className="table-info">
                Showing 1 to {filteredFaculty.length} of {totalFaculty} entries
              </div>
              <div className="pagination">
                <button className="page-btn disabled">Previous</button>
                <button className="page-btn active">1</button>
                <button className="page-btn">2</button>
                <button className="page-btn">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Faculty Modal */}
      {showAddFacultyModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            {/* Modal Header */}
            <div className="modal-header">
              <h2 className="modal-title">Add New Faculty</h2>
            </div>
            
            {/* Modal Content */}
            <div className="modal-content">
              <div className="form-grid">
                {/* First Name */}
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter First Name"
                    value={facultyForm.firstName}
                    onChange={(e) => handleFacultyFormChange('firstName', e.target.value)}
                  />
                </div>
                
                {/* Last Name */}
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Last Name"
                    value={facultyForm.lastName}
                    onChange={(e) => handleFacultyFormChange('lastName', e.target.value)}
                  />
                </div>
                
                {/* Email */}
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter Email Address"
                    value={facultyForm.email}
                    onChange={(e) => handleFacultyFormChange('email', e.target.value)}
                  />
                </div>
                
                {/* Department */}
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select
                    className="form-input"
                    value={facultyForm.department}
                    onChange={(e) => handleFacultyFormChange('department', e.target.value)}
                  >
                    <option value="">Select department</option>
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                
                {/* Position */}
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <select
                    className="form-input"
                    value={facultyForm.position}
                    onChange={(e) => handleFacultyFormChange('position', e.target.value)}
                  >
                    <option value="">Select position</option>
                    {positionOptions.map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
                
                {/* Employment Status */}
                <div className="form-group">
                  <label className="form-label">Employment Status</label>
                  <select
                    className="form-input"
                    value={facultyForm.employmentStatus}
                    onChange={(e) => handleFacultyFormChange('employmentStatus', e.target.value)}
                  >
                    <option value="">Select status</option>
                    {employmentStatusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={closeAddFacultyModal}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddFaculty}
              >
                Add Faculty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyManagement;