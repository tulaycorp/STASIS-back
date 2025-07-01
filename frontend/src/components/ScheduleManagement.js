import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ScheduleManagement.css';
import Sidebar from './Sidebar';
import { useAdminData } from '../hooks/useAdminData';
import { courseSectionAPI, courseAPI, facultyAPI, programAPI, testConnection } from '../services/api';

const ScheduleManagement = () => {
  const { getUserInfo } = useAdminData();
  // State management
  const [scheduleList, setScheduleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({ type: 'all', value: 'All' });
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  // Program and Section Navigation States
  const [programsList, setProgramsList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('All Programs');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [selectedProgramSections, setSelectedProgramSections] = useState([]);

  // Form state
  const [scheduleForm, setScheduleForm] = useState({
    course: '',
    sectionName: '',
    instructor: '',
    room: '',
    day: '',
    startTime: '',
    endTime: '',
    status: 'ACTIVE',
    semester: '',
    year: new Date().getFullYear()
  });

  // Options for dropdowns - only keep rooms and days hardcoded
  const [courseOptions, setCourseOptions] = useState([]);
  const [instructorOptions, setInstructorOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);

  // Keep only rooms and days as hardcoded (as requested)
  const roomOptions = [
    "Room 101", "Room 102", "Room 105", "Room 204", "Room 201", "Room 307",
    "Lab 201", "Lab 202", "Lab 205", "Lab 301", "Lab 302",
    "Lecture Hall A", "Lecture Hall B",
    "Computer Lab 1", "Computer Lab 2"
  ];

  const dayOptions = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
  ];

  // Toast notification state
  const [toasts, setToasts] = useState([]);

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

      // Load all data in parallel
      const [schedulesResponse, coursesResponse, instructorsResponse, programsResponse, sectionsResponse] = await Promise.all([
        courseSectionAPI.getAllSections(),
        courseAPI.getAllCourses(),
        facultyAPI.getAllFaculty(),
        programAPI.getAllPrograms(),
        courseSectionAPI.getAllSections()
      ]);

      // Transform and set schedule data
      const transformedSchedules = schedulesResponse.data.map(section => ({
        id: section.sectionID,
        courseName: section.course?.courseDescription || 'Unknown Course',
        courseId: section.course?.courseCode || 'N/A',
        section: section.sectionName,
        instructor: section.faculty ? `${section.faculty.firstName} ${section.faculty.lastName}` : 'TBA',
        room: section.room || 'TBA',
        day: section.day || 'TBA',
        timeFrom: section.startTime || '00:00',
        timeTo: section.endTime || '00:00',
        status: section.status || 'ACTIVE',
        semester: section.semester || 'Current',
        year: section.year || new Date().getFullYear(),
        program: section.course?.program?.programName
      }));
      
      setScheduleList(transformedSchedules);
      
      // Set course options
      setCourseOptions(coursesResponse.data.map(course => ({
        id: course.id,
        label: `${course.courseCode} - ${course.courseDescription}`,
        value: course.courseCode
      })));

      // Set instructor options
      setInstructorOptions(instructorsResponse.data.map(faculty => ({
        id: faculty.facultyID,
        label: `${faculty.firstName} ${faculty.lastName}`,
        value: faculty.facultyID
      })));

      // Set programs and sections
      setProgramsList(programsResponse.data);
      setSectionsList(sectionsResponse.data);

      // Load status options
      const uniqueStatuses = [...new Set(schedulesResponse.data.map(section => section.status).filter(Boolean))];
      setStatusOptions(uniqueStatuses.length > 0 ? uniqueStatuses.sort() : ['ACTIVE', 'CANCELLED', 'COMPLETED', 'FULL']);

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

  // Reload schedules after operations
  const reloadSchedules = async () => {
    try {
      const response = await courseSectionAPI.getAllSections();
      const transformedData = response.data.map(section => ({
        id: section.sectionID,
        courseName: section.course?.courseDescription || 'Unknown Course',
        courseId: section.course?.courseCode || 'N/A',
        section: section.sectionName,
        instructor: section.faculty ? `${section.faculty.firstName} ${section.faculty.lastName}` : 'TBA',
        room: section.room || 'TBA',
        day: section.day || 'TBA',
        timeFrom: section.startTime || '00:00',
        timeTo: section.endTime || '00:00',
        status: section.status || 'ACTIVE',
        semester: section.semester || 'Current',
        year: section.year || new Date().getFullYear(),
        program: section.course?.program?.programName
      }));
      setScheduleList(transformedData);
    } catch (err) {
      console.error('Error reloading schedules:', err);
    }
  };

  // Form handlers
  const handleScheduleFormChange = (field, value) => {
    setScheduleForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Toast notification function
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Add new schedule
  const handleAddSchedule = async () => {
    try {
      // Validate required fields
      if (!scheduleForm.course || !scheduleForm.sectionName || !scheduleForm.instructor || 
          !scheduleForm.room || !scheduleForm.day || !scheduleForm.startTime || !scheduleForm.endTime) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      // Validate section data
      const validationData = {
        sectionName: scheduleForm.sectionName,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        day: scheduleForm.day
      };

      await courseSectionAPI.validateSection(validationData);

      // Find course and faculty objects
      const selectedCourse = courseOptions.find(c => c.value === scheduleForm.course);
      const selectedFaculty = instructorOptions.find(f => f.value === parseInt(scheduleForm.instructor));

      // Prepare section data for API
      const sectionData = {
        sectionName: scheduleForm.sectionName,
        semester: scheduleForm.semester || 'Current',
        year: scheduleForm.year,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        day: scheduleForm.day,
        status: scheduleForm.status,
        room: scheduleForm.room,
        course: { id: selectedCourse?.id },
        faculty: selectedFaculty ? { facultyID: selectedFaculty.value } : null
      };

      await courseSectionAPI.createSection(sectionData);
      showToast('Schedule added successfully!', 'success');
      closeAddScheduleModal();
      reloadSchedules();
    } catch (error) {
      console.error('Error adding schedule:', error);
      if (error.response?.status === 400) {
        showToast(error.response.data || 'Invalid schedule data provided!', 'error');
      } else {
        showToast('Failed to add schedule. Please try again.', 'error');
      }
    }
  };

  // Edit schedule
  const showEditScheduleForm = (schedule) => {
    setEditingSchedule(schedule);
    
    // Find the course value for the dropdown
    const courseOption = courseOptions.find(c => c.label.includes(schedule.courseName || schedule.course || ''));
    const instructorOption = instructorOptions.find(i => i.label === schedule.instructor);
    
    setScheduleForm({
      course: courseOption?.value || '',
      sectionName: schedule.section,
      instructor: instructorOption?.value || '',
      room: schedule.room,
      day: schedule.day,
      startTime: schedule.timeFrom,
      endTime: schedule.timeTo,
      status: schedule.status,
      semester: schedule.semester,
      year: schedule.year
    });
    setShowEditScheduleModal(true);
  };

  const handleEditSchedule = async () => {
    try {
      if (!editingSchedule) return;

      // Similar validation and data preparation as add
      const selectedCourse = courseOptions.find(c => c.value === scheduleForm.course);
      const selectedFaculty = instructorOptions.find(f => f.value === parseInt(scheduleForm.instructor));

      const sectionData = {
        sectionID: editingSchedule.id,
        sectionName: scheduleForm.sectionName,
        semester: scheduleForm.semester,
        year: scheduleForm.year,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        day: scheduleForm.day,
        status: scheduleForm.status,
        room: scheduleForm.room,
        course: selectedCourse ? { id: selectedCourse.id } : null,
        faculty: selectedFaculty ? { facultyID: selectedFaculty.value } : null
      };

      await courseSectionAPI.updateSection(editingSchedule.id, sectionData);
      showToast('Schedule updated successfully!', 'success');
      closeEditScheduleModal();
      reloadSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
      showToast('Failed to update schedule. Please try again.', 'error');
    }
  };

  // Delete schedule
  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await courseSectionAPI.deleteSection(scheduleId);
        showToast('Schedule deleted successfully!', 'success');
        reloadSchedules();
      } catch (error) {
        console.error('Error deleting schedule:', error);
        showToast('Failed to delete schedule. Please try again.', 'error');
      }
    }
  };

  // Update status
  const handleUpdateStatus = async (scheduleId, newStatus) => {
    try {
      await courseSectionAPI.updateSectionStatus(scheduleId, newStatus);
      showToast('Status updated successfully!', 'success');
      reloadSchedules();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status. Please try again.', 'error');
    }
  };

  // Modal handlers
  const showAddScheduleForm = () => {
    setScheduleForm({
      course: '',
      sectionName: '',
      instructor: '',
      room: '',
      day: '',
      startTime: '',
      endTime: '',
      status: statusOptions.length > 0 ? statusOptions[0] : 'ACTIVE',
      semester: 'Current',
      year: new Date().getFullYear()
    });
    setShowAddScheduleModal(true);
  };

  const closeAddScheduleModal = () => {
    setShowAddScheduleModal(false);
    setScheduleForm({
      course: '',
      sectionName: '',
      instructor: '',
      room: '',
      day: '',
      startTime: '',
      endTime: '',
      status: statusOptions.length > 0 ? statusOptions[0] : 'ACTIVE',
      semester: 'Current',
      year: new Date().getFullYear()
    });
  };

  const closeEditScheduleModal = () => {
    setShowEditScheduleModal(false);
    setEditingSchedule(null);
    setScheduleForm({
      course: '',
      sectionName: '',
      instructor: '',
      room: '',
      day: '',
      startTime: '',
      endTime: '',
      status: statusOptions.length > 0 ? statusOptions[0] : 'ACTIVE',
      semester: 'Current',
      year: new Date().getFullYear()
    });
  };

  // Get unique values from scheduleList for dynamic filters
  const getUniqueInstructors = () => {
    return [...new Set(scheduleList.map(s => s.instructor).filter(Boolean))];
  };

  const getUniqueStatuses = () => {
    return [...new Set(scheduleList.map(s => s.status).filter(Boolean))];
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
      // Filter sections for the selected program
      const programSections = sectionsList.filter(section =>
        section.programName === programName ||
        section.program?.programName === programName
      );
      setSelectedProgramSections(programSections);
    }
  };

  // Handle section selection
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

  // Filter schedules with section filtering only
  const filteredSchedules = scheduleList.filter(schedule => {
    const courseName = schedule.courseName || schedule.course || '';
    const courseId = schedule.courseId || '';
    const matchesSearch = courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         courseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.room.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter.type === 'all' || 
                         (filter.type === 'status' && schedule.status === filter.value) ||
                         (filter.type === 'day' && schedule.day === filter.value) ||
                         (filter.type === 'instructor' && schedule.instructor === filter.value);

    // Only filter by section, not by program
    const matchesSection = selectedSection === 'All Sections' || schedule.section === selectedSection;
    
    return matchesSearch && matchesFilter && matchesSection;
  });

  // Calculate dynamic statistics
  const totalSchedules = scheduleList.length;
  const activeSchedules = scheduleList.filter(s => s.status === 'ACTIVE').length;
  const completedSchedules = scheduleList.filter(s => s.status === 'COMPLETED').length;
  const cancelledSchedules = scheduleList.filter(s => s.status === 'CANCELLED').length;

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
      case 'Faculty':
        navigate('/faculty-management');
        break;
      case 'Curriculum':
        navigate('/curriculum-management');
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

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar 
          onNavigate={showSection}
          userInfo={getUserInfo()}
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
              <p>Loading schedules...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard-container">
        <Sidebar 
          onNavigate={showSection}
          userInfo={getUserInfo()}
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
                <p>{error}</p>
                <button onClick={reloadSchedules} className="btn btn-primary">
                  Retry
                </button>
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
      <Sidebar 
        onNavigate={showSection}
        userInfo={getUserInfo()}
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
            <span className="breadcrumb-current">Schedule Management</span>
          </div>
          
          <div className="dashboard-header">
            <h1 className="dashboard-welcome-title">Schedule Management</h1>
            <button className="btn btn-primary" onClick={showAddScheduleForm}>
              + Add New Schedule
            </button>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">📅</div>
              <div className="stat-content">
                <h3>Total Schedules</h3>
                <div className="stat-value">{totalSchedules}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple">✅</div>
              <div className="stat-content">
                <h3>Active</h3>
                <div className="stat-value">{activeSchedules}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">✔️</div>
              <div className="stat-content">
                <h3>Completed</h3>
                <div className="stat-value">{completedSchedules}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">❌</div>
              <div className="stat-content">
                <h3>Cancelled</h3>
                <div className="stat-value">{cancelledSchedules}</div>
              </div>
            </div>
          </div>

          {/* Student Content Wrapper with Sidebar */}
          <div className="student-content-wrapper">
            {/* Sidebar Container */}
            <div className="student-sidebar">
              {/* Program Navigation Card */}
              <div className="student-nav-section">
                <div className="student-nav-header">
                  <h3 className="student-nav-title">Programs</h3>
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
                      key={program.id}
                      className={`student-nav-item ${selectedProgram === program.programName ? 'student-nav-item-active' : ''}`}
                      onClick={() => handleProgramSelect(program.programName)}
                    >
                      <span className="student-nav-icon">📚</span>
                      {program.programName}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Navigation Card */}
              <div className="student-nav-section">
                <div className="student-nav-header">
                  <h3 className="student-nav-title">Sections</h3>
                </div>
                <div className="student-nav-list">
                  <div
                    className={`student-nav-item ${selectedSection === 'All Sections' ? 'student-nav-item-active' : ''}`}
                    onClick={() => handleSectionSelect('All Sections')}
                  >
                    <span className="student-nav-icon">📋</span>
                    All Sections
                  </div>
                  {(selectedProgram === 'All Programs' ? sectionsList : selectedProgramSections).map((section) => (
                    <div
                      key={section.sectionID}
                      className={`student-nav-item ${selectedSection === section.sectionName ? 'student-nav-item-active' : ''}`}
                      onClick={() => handleSectionSelect(section.sectionName)}
                    >
                      <span className="student-nav-icon">📋</span>
                      {section.sectionName}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Schedule Section */}
            <div className="student-main-section">
              <div className="student-section-header">
                <h2 className="student-section-title">
                  {selectedProgram === 'All Programs' ? 'All Schedules' : `${selectedProgram} Schedules`}
                  {selectedSection !== 'All Sections' && ` - ${selectedSection}`}
                </h2>
                <p className="student-section-desc">
                  {filteredSchedules.length} schedule{filteredSchedules.length !== 1 ? 's' : ''} found
                </p>
              </div>

              <div className="student-section-content">
                {/* Search and Filter */}
                <div className="student-filters">
                  <div className="student-search-group">
                    <input
                      type="text"
                      className="student-search-input"
                      placeholder="Search schedules..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="student-header-actions">
                    <select
                      className="form-input"
                      value={`${filter.type}:${filter.value}`}
                      onChange={(e) => {
                        const [type, value] = e.target.value.split(':');
                        setFilter({ type, value });
                      }}
                    >
                      <option value="all:All">All Schedules</option>
                      {/* Dynamic status filters */}
                      {getUniqueStatuses().map(status => (
                        <option key={status} value={`status:${status}`}>{status} Only</option>
                      ))}
                      {/* Dynamic day filters */}
                      {dayOptions.map(day => (
                        <option key={day} value={`day:${day}`}>{day}</option>
                      ))}
                      {/* Dynamic instructor filters */}
                      {getUniqueInstructors().map(instructor => (
                        <option key={instructor} value={`instructor:${instructor}`}>{instructor}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Schedule Table */}
                <div className="student-table-container">
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>Course ID</th>
                        <th>Course Name</th>
                        <th>Section</th>
                        <th>Instructor</th>
                        <th>Room</th>
                        <th>Day & Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchedules.length > 0 ? (
                        filteredSchedules.map((schedule) => (
                          <tr key={schedule.id}>
                            <td className="course-id">{schedule.courseId || 'N/A'}</td>
                            <td className="course-name">{schedule.courseName || schedule.course || 'N/A'}</td>
                            <td className="section">{schedule.section}</td>
                            <td className="instructor">{schedule.instructor}</td>
                            <td className="room">{schedule.room}</td>
                            <td className="day-time">
                              <div className="student-name">{schedule.day}</div>
                              <div className="student-email">{schedule.timeFrom} - {schedule.timeTo}</div>
                            </td>
                            <td className="status">
                              <span className={`status-badge status-${schedule.status.toLowerCase()}`}>
                                {schedule.status}
                              </span>
                            </td>
                            <td className="actions">
                              <div className="action-buttons">
                                <button
                                  className="btn-action btn-edit"
                                  onClick={() => showEditScheduleForm(schedule)}
                                  title="Edit Schedule"
                                >
                                </button>
                                <button
                                  className="btn-action btn-delete"
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                  title="Delete Schedule"
                                >
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="no-students">
                            No schedules found matching the current filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Schedule</h2>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.course}
                    onChange={(e) => handleScheduleFormChange('course', e.target.value)}
                  >
                    <option value="">Select course</option>
                    {courseOptions.map((course) => (
                      <option key={course.id} value={course.value}>{course.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Section Name *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.sectionName}
                    onChange={(e) => handleScheduleFormChange('sectionName', e.target.value)}
                  >
                    <option value="">Select section</option>
                    {sectionsList.map((section) => (
                      <option key={section.sectionID} value={section.sectionName}>
                        {section.sectionName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Instructor *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.instructor}
                    onChange={(e) => handleScheduleFormChange('instructor', e.target.value)}
                  >
                    <option value="">Select instructor</option>
                    {instructorOptions.map((instructor) => (
                      <option key={instructor.id} value={instructor.value}>{instructor.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Room *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.room}
                    onChange={(e) => handleScheduleFormChange('room', e.target.value)}
                  >
                    <option value="">Select room</option>
                    {roomOptions.map((room) => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Day *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.day}
                    onChange={(e) => handleScheduleFormChange('day', e.target.value)}
                  >
                    <option value="">Select day</option>
                    {dayOptions.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={scheduleForm.startTime}
                    onChange={(e) => handleScheduleFormChange('startTime', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={scheduleForm.endTime}
                    onChange={(e) => handleScheduleFormChange('endTime', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={scheduleForm.status}
                    onChange={(e) => handleScheduleFormChange('status', e.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeAddScheduleModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddSchedule}>
                Add Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEditScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Schedule</h2>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.course}
                    onChange={(e) => handleScheduleFormChange('course', e.target.value)}
                  >
                    <option value="">Select course</option>
                    {courseOptions.map((course) => (
                      <option key={course.id} value={course.value}>{course.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Section Name *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.sectionName}
                    onChange={(e) => handleScheduleFormChange('sectionName', e.target.value)}
                  >
                    <option value="">Select section</option>
                    {sectionsList.map((section) => (
                      <option key={section.sectionID} value={section.sectionName}>
                        {section.sectionName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Instructor *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.instructor}
                    onChange={(e) => handleScheduleFormChange('instructor', e.target.value)}
                  >
                    <option value="">Select instructor</option>
                    {instructorOptions.map((instructor) => (
                      <option key={instructor.id} value={instructor.value}>{instructor.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Room *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.room}
                    onChange={(e) => handleScheduleFormChange('room', e.target.value)}
                  >
                    <option value="">Select room</option>
                    {roomOptions.map((room) => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Day *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.day}
                    onChange={(e) => handleScheduleFormChange('day', e.target.value)}
                  >
                    <option value="">Select day</option>
                    {dayOptions.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={scheduleForm.startTime}
                    onChange={(e) => handleScheduleFormChange('startTime', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={scheduleForm.endTime}
                    onChange={(e) => handleScheduleFormChange('endTime', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={scheduleForm.status}
                    onChange={(e) => handleScheduleFormChange('status', e.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeEditScheduleModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEditSchedule}>
                Update Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;