import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CurriculumManagement.css';
import Sidebar from './Sidebar';

const CurriculumManagement = () => {
  // Sample curriculum data
  const [curriculumData, setCurriculumData] = useState([
    /*
        data here separated by {} example:
        {
            id: 1,
            name: "Computer Science Curriculum",
            code: "CUR001",
            program: "BS Computer Science",
            academicYear: "2025-2026",
            status: "Active",
            lastUpdated: "2025-03-06",
            description: ""
        },
        {
            id: 2,
            name: "Information Technology Curriculum",
            code: "CUR002",
            program: "BS Information Technology",
            academicYear: "2025-2026",
            status: "Draft",
            lastUpdated: "2025-02-11",
            description: ""
        }
    */
   ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    program: '',
    academicYear: '',
    status: '',
    description: ''
  });

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

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  // Modal functions
  const openModal = () => {
    setIsModalOpen(true);
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      program: '',
      academicYear: '',
      status: '',
      description: ''
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      program: '',
      academicYear: '',
      status: '',
      description: ''
    });
  };

  // Edit curriculum
  const editCurriculum = (id) => {
    const curriculum = curriculumData.find(c => c.id === id);
    if (curriculum) {
      setFormData({
        name: curriculum.name,
        code: curriculum.code,
        program: curriculum.program,
        academicYear: curriculum.academicYear,
        status: curriculum.status,
        description: curriculum.description || ''
      });
      setEditingId(id);
      setIsModalOpen(true);
    }
  };

  // Save curriculum
  const saveCurriculum = () => {
    // Validate required fields
    if (!formData.name || !formData.code || !formData.program || 
        !formData.academicYear || !formData.status) {
      alert('Please fill in all required fields.');
      return;
    }

    const curriculumToSave = {
      ...formData,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (editingId) {
      // Update existing curriculum
      setCurriculumData(prev => prev.map(c => 
        c.id === editingId ? { ...c, ...curriculumToSave } : c
      ));
      alert('Curriculum updated successfully!');
    } else {
      // Add new curriculum
      const newCurriculum = {
        ...curriculumToSave,
        id: Date.now()
      };
      setCurriculumData(prev => [...prev, newCurriculum]);
      alert('Curriculum created successfully!');
    }

    closeModal();
  };

  // Delete curriculum
  const deleteCurriculum = (id) => {
    if (window.confirm('Are you sure you want to delete this curriculum?')) {
      setCurriculumData(prev => prev.filter(c => c.id !== id));
      alert('Curriculum deleted successfully!');
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
  const navigate = useNavigate();  const showSection = (section) => {
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
  return (
    <div className="container">      {/* Sidebar */}
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
        {/* Header */}
        <div className="header">
          <div>
            <div className="breadcrumb">Home &gt; Curriculum</div>
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
              <h3>Academic Year</h3>
              <div className="stat-value">2025-2026</div>
            </div>
          </div>
        </div>

        {/* Curriculum List */}
        <div className="curriculum-section">
          <div className="section-header">
            <h2 className="section-title">Curriculum List</h2>
            <div className="search-filter">
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search curriculum..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="filter-btn">🔽</button>
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
                      <div className="action-buttons">                        <button 
                          className="action-btn edit-btn" 
                          onClick={() => editCurriculum(curriculum.id)}
                          title="Edit"
                        >
                        </button>
                        <button 
                          className="action-btn delete-btn" 
                          onClick={() => deleteCurriculum(curriculum.id)}
                          title="Delete"
                        >
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
                <label className="form-label">Curriculum Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Curriculum Code</label>
                <input 
                  type="text" 
                  className="form-input" 
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Program</label>
                <select 
                  className="form-select" 
                  name="program"
                  value={formData.program}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Program</option>
                  <option value="BS Computer Science">BS Computer Science</option>
                  <option value="BS Information Technology">BS Information Technology</option>
                  <option value="BS Business Administration">BS Business Administration</option>
                  <option value="BS Engineering">BS Engineering</option>
                  <option value="BS Psychology">BS Psychology</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Academic Year</label>
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
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
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
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={saveCurriculum}>
                Save Curriculum
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumManagement;