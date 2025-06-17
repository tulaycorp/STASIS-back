import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FacultyManagement.css';
import Sidebar from './Sidebar';
import { facultyAPI, programAPI } from '../services/api';

const FacultyManagement = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showEditFacultyModal, setShowEditFacultyModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [facultyForm, setFacultyForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    programId: '',
    position: '',
    status: 'Active'
  });

  const [selectedProgram, setSelectedProgram] = useState('All Programs');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Status options
  const statusOptions = [
    'Active',
    'Inactive',
    'On Leave',
    'Retired'
  ];

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both faculty and programs
      await Promise.all([
        loadFaculty(),
        loadPrograms()
      ]);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadFaculty = async () => {
    try {
      const response = await facultyAPI.getAllFaculty();
      console.log('Faculty loaded:', response.data);
      setFacultyList(response.data);
    } catch (error) {
      console.error('Error loading faculty:', error);
      throw error;
    }
  };

  const loadPrograms = async () => {
    try {
      const response = await programAPI.getAllPrograms();
      console.log('Programs loaded:', response.data);
      setProgramsList(response.data);
    } catch (error) {
      console.error('Error loading programs:', error);
      throw error;
    }
  };

  // Statistics calculations
  const totalFaculty = facultyList.length;
  const activeFaculty = facultyList.filter(f => f.status === 'Active').length;
  const inactiveFaculty = facultyList.filter(f => f.status === 'Inactive').length;
  const totalPrograms = [...new Set(facultyList.map(f => f.program?.programName))].filter(Boolean).length;

  // Filter faculty based on search and program
  const filteredFaculty = facultyList.filter(faculty => {
    const matchesSearch = 
      faculty.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.facultyID?.toString().includes(searchTerm.toLowerCase());
    
    const matchesProgram = selectedProgram === 'All Programs' || 
      faculty.program?.programName === selectedProgram;
    
    return matchesSearch && matchesProgram;
  });

  // Add Faculty Modal functions
  const showAddFacultyForm = () => {
    console.log('Programs available for dropdown:', programsList);
    setFacultyForm({
      firstName: '',
      lastName: '',
      email: '',
      programId: '',
      position: '',
      status: 'Active'
    });
    setShowAddFacultyModal(true);
  };

  const closeAddFacultyModal = () => {
    setShowAddFacultyModal(false);
    setFacultyForm({
      firstName: '',
      lastName: '',
      email: '',
      programId: '',
      position: '',
      status: 'Active'
    });
  };

  // Edit Faculty Modal functions
  const showEditFacultyForm = (faculty) => {
    console.log('Editing faculty:', faculty);
    console.log('Programs available for edit dropdown:', programsList);
    
    setEditingFaculty(faculty);
    setFacultyForm({
      firstName: faculty.firstName || '',
      lastName: faculty.lastName || '',
      email: faculty.email || '',
      programId: faculty.program?.programID?.toString() || '',
      position: faculty.position || '',
      status: faculty.status || 'Active'
    });
    setShowEditFacultyModal(true);
  };

  const closeEditFacultyModal = () => {
    setShowEditFacultyModal(false);
    setEditingFaculty(null);
    setFacultyForm({
      firstName: '',
      lastName: '',
      email: '',
      programId: '',
      position: '',
      status: 'Active'
    });
  };

  const handleFacultyFormChange = (field, value) => {
    console.log(`Form field changed: ${field} = ${value}`);
    setFacultyForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddFaculty = async () => {
    // Validate required fields
    if (!facultyForm.firstName || !facultyForm.lastName || !facultyForm.email) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(facultyForm.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      // Find the selected program object
      const selectedProgramObj = programsList.find(p => p.programID.toString() === facultyForm.programId);
      console.log('Selected program for new faculty:', selectedProgramObj);
      
      const facultyData = {
        firstName: facultyForm.firstName,
        lastName: facultyForm.lastName,
        email: facultyForm.email,
        position: facultyForm.position || 'Assistant Professor',
        status: facultyForm.status || 'Active',
        program: selectedProgramObj || null
      };

      console.log('Sending faculty data:', facultyData);
      await facultyAPI.createFaculty(facultyData);
      alert('Faculty added successfully!');
      closeAddFacultyModal();
      loadFaculty(); // Reload faculty list
    } catch (error) {
      console.error('Error adding faculty:', error);
      if (error.response?.status === 400) {
        alert('Email already exists or invalid data provided!');
      } else {
        alert('Failed to add faculty. Please try again.');
      }
    }
  };

  const handleEditFaculty = async () => {
    // Validate required fields
    if (!facultyForm.firstName || !facultyForm.lastName || !facultyForm.email) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(facultyForm.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      // Find the selected program object
      const selectedProgramObj = programsList.find(p => p.programID.toString() === facultyForm.programId);
      console.log('Selected program for editing faculty:', selectedProgramObj);
      
      const facultyData = {
        firstName: facultyForm.firstName,
        lastName: facultyForm.lastName,
        email: facultyForm.email,
        position: facultyForm.position || 'Assistant Professor',
        status: facultyForm.status || 'Active',
        program: selectedProgramObj || null
      };

      console.log('Sending updated faculty data:', facultyData);
      await facultyAPI.updateFaculty(editingFaculty.facultyID, facultyData);
      alert('Faculty updated successfully!');
      closeEditFacultyModal();
      loadFaculty(); // Reload faculty list
    } catch (error) {
      console.error('Error updating faculty:', error);
      if (error.response?.status === 400) {
        alert('Email already exists or invalid data provided!');
      } else if (error.response?.status === 404) {
        alert('Faculty not found!');
      } else {
        alert('Failed to update faculty. Please try again.');
      }
    }
  };

  const handleDeleteFaculty = async (facultyId) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        await facultyAPI.deleteFaculty(facultyId);
        alert('Faculty deleted successfully!');
        loadFaculty(); // Reload faculty list
      } catch (error) {
        console.error('Error deleting faculty:', error);
        if (error.response?.status === 404) {
          alert('Faculty not found!');
        } else {
          alert('Failed to delete faculty. Please try again.');
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
              <p>Loading faculty data...</p>
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
              <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
                <h3>Error Loading Faculty Data</h3>
                <p>{error}</p>
              </div>
              <button onClick={loadInitialData} className="btn btn-primary">
                Retry
              </button>
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

      {/* Main Content */}
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
            <span className="breadcrumb-current">Faculty Management</span>
          </div>
          
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">Faculty Management</h1>
            <button 
              onClick={showAddFacultyForm}
              className="add-faculty-btn"
            >
              + Add New Faculty
            </button>
          </div>

          {/* Stats Cards - Updated */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Faculty</div>
              <div className="stat-value">{totalFaculty}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active</div>
              <div className="stat-value">{activeFaculty}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Inactive</div>
              <div className="stat-value">{inactiveFaculty}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Programs</div>
              <div className="stat-value">{totalPrograms}</div>
            </div>
          </div>

          {/* Faculty List */}
          <div className="faculty-list-container">
            <div className="list-header">
              <div className="list-controls">
                <h2 className="list-title">Faculty List</h2>
                <div className="controls">
                  <select 
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="select-input"
                  >
                    <option>All Programs</option>
                    {programsList.map(program => (
                      <option key={program.programID} value={program.programName}>
                        {program.programName}
                      </option>
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
                    <th>Program</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculty.map((faculty) => (
                    <tr key={faculty.facultyID}>
                      <td>{faculty.facultyID}</td>
                      <td>
                        <div className="faculty-info">
                          <div className="faculty-name">
                            {faculty.firstName} {faculty.lastName}
                          </div>
                          <div className="faculty-position">{faculty.position}</div>
                        </div>
                      </td>
                      <td>{faculty.program?.programName || 'No Program'}</td>
                      <td>{faculty.email}</td>
                      <td>
                        <span className={`status-badge ${faculty.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                          {faculty.status}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <button //Edit Button
                          className="btn-edit"
                          onClick={() => showEditFacultyForm(faculty)}
                          title="Edit Faculty"
                        >
                        </button>
                        <button //Delete Button
                          className="btn-delete"
                          onClick={() => handleDeleteFaculty(faculty.facultyID)}
                          title="Delete Faculty"
                        >
                        </button>
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
            </div>
          </div>
        </div>
      </div>

      {/* Add Faculty Modal */}
      {showAddFacultyModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Add New Faculty</h2>
            </div>
            
            <div className="modal-content">
              <div className="form-grid">
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
                
                <div className="form-group">
                  <label className="form-label">Program</label>
                  <select
                    className="form-input"
                    value={facultyForm.programId}
                    onChange={(e) => handleFacultyFormChange('programId', e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programsList && programsList.length > 0 ? (
                      programsList.map((program) => (
                        <option key={program.programID} value={program.programID}>
                          {program.programName}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No programs available</option>
                    )}
                  </select>
                  {programsList.length === 0 && (
                    <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                      No programs loaded. Please refresh the page.
                    </small>
                  )}
                </div>
                
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
                
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={facultyForm.status}
                    onChange={(e) => handleFacultyFormChange('status', e.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
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

      {/* Edit Faculty Modal */}
      {showEditFacultyModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Edit Faculty</h2>
            </div>
            
            <div className="modal-content">
              <div className="form-grid">
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
                
                <div className="form-group">
                  <label className="form-label">Program</label>
                  <select
                    className="form-input"
                    value={facultyForm.programId}
                    onChange={(e) => handleFacultyFormChange('programId', e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programsList && programsList.length > 0 ? (
                      programsList.map((program) => (
                        <option key={`edit-${program.programID}`} value={program.programID}>
                          {program.programName}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No programs available</option>
                    )}
                  </select>
                  {programsList.length === 0 && (
                    <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                      No programs loaded. Please refresh the page.
                    </small>
                  )}
                </div>
                
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
                
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={facultyForm.status}
                    onChange={(e) => handleFacultyFormChange('status', e.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={closeEditFacultyModal}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleEditFaculty}
              >
                Update Faculty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyManagement;