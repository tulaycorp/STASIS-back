import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CurriculumManagement.css';
import Sidebar from './Sidebar';
import { curriculumAPI, programAPI, testConnection } from '../services/api';

const CurriculumManagement = () => {
  // State management
  const [curriculumData, setCurriculumData] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    curriculumName: '',
    curriculumCode: '',
    programId: '',
    academicYear: '',
    status: 'Draft',
    description: ''
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

      // Load curriculums and programs in parallel
      await Promise.all([
        loadCurriculums(),
        loadPrograms()
      ]);
      
    } catch (err) {
      console.error('Error loading initial data:', err);
      handleConnectionError(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCurriculums = async () => {
    try {
      console.log('Loading curriculums from API...');
      const response = await curriculumAPI.getAllCurriculums();
      console.log('Curriculums loaded:', response.data);
      
      // Transform backend data to match frontend expectations - using backend entities
      const transformedData = response.data.map(curriculum => ({
        id: curriculum.curriculumID,
        name: curriculum.curriculumName,
        code: curriculum.curriculumCode || 'N/A',
        program: curriculum.program?.programName || 'No Program', // Extract programName from Program object
        programId: curriculum.program?.programID || null,
        academicYear: curriculum.academicYear || 'N/A',
        status: curriculum.status || 'Draft', // Use status string directly
        lastUpdated: curriculum.lastUpdated || curriculum.effectiveStartDate, // Use backend date fields
        description: curriculum.description || '',
        effectiveStartDate: curriculum.effectiveStartDate,
        // Keep the full program object for editing
        programObject: curriculum.program
      }));
      
      setCurriculumData(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error loading curriculums:', err);
      throw err;
    }
  };

  const loadPrograms = async () => {
    try {
      const response = await programAPI.getAllPrograms();
      console.log('Programs loaded:', response.data);
      setProgramsList(response.data);
    } catch (err) {
      console.error('Error loading programs:', err);
      // Don't throw here, programs are optional for curriculum creation
    }
  };

  const handleConnectionError = (err) => {
    if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
      setError('Cannot connect to server. Please check:\n1. Backend is running on http://localhost:8080\n2. No firewall blocking the connection\n3. Backend started without errors');
    } else if (err.code === 'ECONNREFUSED') {
      setError('Connection refused. The backend server is not running on http://localhost:8080');
    } else if (err.response?.status === 404) {
      setError('API endpoint not found. Please check if the CurriculumController is properly configured.');
    } else if (err.response?.status === 500) {
      setError('Server error. Please check the backend console for error details.');
    } else if (err.response?.status === 0) {
      setError('Network error. This might be a CORS issue or the server is not responding.');
    } else {
      setError(`Failed to load curricula: ${err.response?.data?.message || err.message}`);
    }
  };

  // Filter data based on search
  const filteredData = curriculumData.filter(curriculum =>
    curriculum.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curriculum.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curriculum.program.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Statistics
  const activeCurricula = curriculumData.filter(c => c.status === 'Active').length;

  // Format date using backend LocalDate
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle LocalDate format from backend (yyyy-mm-dd)
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch {
      return dateString;
    }
  };

  // Modal functions
  const openModal = () => {
    setIsModalOpen(true);
    setEditingId(null);
    setFormData({
      curriculumName: '',
      curriculumCode: '',
      programId: '',
      academicYear: '',
      status: 'Draft',
      description: ''
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      curriculumName: '',
      curriculumCode: '',
      programId: '',
      academicYear: '',
      status: 'Draft',
      description: ''
    });
  };

  // Edit curriculum
  const editCurriculum = (id) => {
    const curriculum = curriculumData.find(c => c.id === id);
    if (curriculum) {
      setEditingId(id);
      setFormData({
        curriculumName: curriculum.name,
        curriculumCode: curriculum.code,
        programId: curriculum.programId?.toString() || '',
        academicYear: curriculum.academicYear,
        status: curriculum.status,
        description: curriculum.description
      });
      setIsModalOpen(true);
    }
  };

  // Save curriculum
  const saveCurriculum = async () => {
    try {
      // Validate required fields
      if (!formData.curriculumName || !formData.curriculumCode || !formData.programId || 
          !formData.academicYear || !formData.status) {
        alert('Please fill in all required fields.');
        return;
      }

      // Find the selected program object - send full Program object
      const selectedProgram = programsList.find(p => p.programID.toString() === formData.programId);
      
      const curriculumToSave = {
        curriculumName: formData.curriculumName,
        curriculumCode: formData.curriculumCode,
        academicYear: formData.academicYear,
        status: formData.status, // Use status string directly
        description: formData.description,
        program: selectedProgram // Send full Program object to backend
      };

      if (editingId) {
        // Update existing curriculum
        await curriculumAPI.updateCurriculum(editingId, curriculumToSave);
        alert('Curriculum updated successfully!');
      } else {
        // Create new curriculum
        await curriculumAPI.createCurriculum(curriculumToSave);
        alert('Curriculum created successfully!');
      }

      closeModal();
      loadCurriculums(); // Reload the list
    } catch (error) {
      console.error('Error saving curriculum:', error);
      if (error.response?.status === 400) {
        alert('Invalid data provided. Please check your input.');
      } else if (error.response?.status === 404) {
        alert('Curriculum not found!');
      } else if (error.response?.status === 500) {
        alert('Server error. Please try again later.');
      } else {
        alert('Failed to save curriculum. Please try again.');
      }
    }
  };

  // Delete curriculum
  const deleteCurriculum = async (id) => {
    if (window.confirm('Are you sure you want to delete this curriculum?')) {
      try {
        await curriculumAPI.deleteCurriculum(id);
        alert('Curriculum deleted successfully!');
        loadCurriculums(); // Reload the list
      } catch (error) {
        console.error('Error deleting curriculum:', error);
        if (error.response?.status === 404) {
          alert('Curriculum not found!');
        } else if (error.response?.status === 500) {
          alert('Server error. Please try again later.');
        } else {
          alert('Failed to delete curriculum. Please try again.');
        }
      }
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Pagination functions
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
              <h3>Loading curricula...</h3>
              <p>Please wait while we fetch the data from the server.</p>
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
                    <li>Try accessing the API directly: <code>http://localhost:8080/api/curriculums</code></li>
                  </ol>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                  <button onClick={loadInitialData} className="btn btn-primary">
                    Retry Connection
                  </button>
                  <button 
                    onClick={() => window.open('http://localhost:8080/api/curriculums', '_blank')} 
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
    <div className="container">
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
            <span className="breadcrumb-current">Curriculum Management</span>
          </div>

          {/* Header */}
          <div className="header">
            <div>
              <h1 className="page-title">Curriculum Management</h1>
            </div>
            <button className="create-btn" onClick={openModal}>
              + Create New Curriculum
            </button>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">📘</div>
              <div className="stat-content">
                <h3>Active Curricula</h3>
                <div className="stat-value">{activeCurricula}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">📅</div>
              <div className="stat-content">
                <h3>Total Curricula</h3>
                <div className="stat-value">{curriculumData.length}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">📚</div>
              <div className="stat-content">
                <h3>Programs</h3>
                <div className="stat-value">{programsList.length}</div>
              </div>
            </div>
          </div>

          {/* Curriculum Section */}
          <div className="curriculum-section">
            <div className="section-header">
              <h2 className="section-title">Curriculum List</h2>
              <div className="search-filter">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search curricula by name, code, or program..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="table-container">
              <table className="curriculum-table">
                <thead>
                  <tr>
                    <th>Curriculum</th>
                    <th>Program</th>
                    <th>Academic Year</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(curriculum => (
                    <tr key={curriculum.id}>
                      <td>
                        <div className="curriculum-name">{curriculum.name}</div>
                        <div className="curriculum-code">{curriculum.code}</div>
                      </td>
                      <td>{curriculum.program}</td>
                      <td>{curriculum.academicYear}</td>
                      <td>
                        <span className={`status-badge status-${curriculum.status.toLowerCase()}`}>
                          {curriculum.status}
                        </span>
                      </td>
                      <td>{formatDate(curriculum.lastUpdated)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn edit-btn" 
                            onClick={() => editCurriculum(curriculum.id)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className="action-btn delete-btn" 
                            onClick={() => deleteCurriculum(curriculum.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div className="pagination-info">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
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
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingId ? 'Edit Curriculum' : 'Create New Curriculum'}
              </h2>
              <span className="close" onClick={closeModal}>&times;</span>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Curriculum Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  name="curriculumName"
                  value={formData.curriculumName}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Curriculum Code *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  name="curriculumCode"
                  value={formData.curriculumCode}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Program *</label>
                <select 
                  className="form-select" 
                  name="programId"
                  value={formData.programId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Program</option>
                  {programsList.map(program => (
                    <option key={program.programID} value={program.programID}>
                      {program.programName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Academic Year *</label>
                <select 
                  className="form-select" 
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Academic Year</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2027-2028">2027-2028</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status *</label>
                <select 
                  className="form-select" 
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea" 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Enter curriculum description..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={saveCurriculum}>
                {editingId ? 'Update Curriculum' : 'Save Curriculum'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumManagement;