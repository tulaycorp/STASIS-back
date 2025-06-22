import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ScheduleManagement.css';
import Sidebar from './Sidebar';
import { courseSectionAPI, courseAPI, facultyAPI } from '../services/api';

const ScheduleManagement = () => {
  // State management
  const [scheduleList, setScheduleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({ type: 'all', value: 'All' });
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

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

  // Load data on component mount
  useEffect(() => {
    loadSchedules();
    loadCourses();
    loadInstructors();
    loadStatusOptions();
  }, []);

  // Load schedules from API
  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await courseSectionAPI.getAllSections();
      console.log('Loaded schedules:', response.data);
      
      // Transform API data to match frontend format
      const transformedData = response.data.map(section => ({
        id: section.sectionID,
        course: section.course?.courseDescription || 'Unknown Course',
        section: section.sectionName,
        instructor: section.faculty ? `${section.faculty.firstName} ${section.faculty.lastName}` : 'TBA',
        room: section.room || 'TBA',
        day: section.day || 'TBA',
        timeFrom: section.startTime || '00:00',
        timeTo: section.endTime || '00:00', 
        status: section.status || 'ACTIVE',
        semester: section.semester || 'Current',
        year: section.year || new Date().getFullYear()
      }));
      
      setScheduleList(transformedData);
    } catch (err) {
      console.error('Error loading schedules:', err);
      setError('Failed to load schedules. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Load courses for dropdown
  const loadCourses = async () => {
    try {
      const response = await courseAPI.getAllCourses();
      setCourseOptions(response.data.map(course => ({
        id: course.id,
        label: `${course.courseCode} - ${course.courseDescription}`,
        value: course.courseCode
      })));
    } catch (err) {
      console.error('Error loading courses:', err);
      setCourseOptions([]);
    }
  };

  // Load instructors for dropdown
  const loadInstructors = async () => {
    try {
      const response = await facultyAPI.getAllFaculty();
      setInstructorOptions(response.data.map(faculty => ({
        id: faculty.facultyID,
        label: `${faculty.firstName} ${faculty.lastName}`,
        value: faculty.facultyID
      })));
    } catch (err) {
      console.error('Error loading instructors:', err);
      setInstructorOptions([]);
    }
  };

  // Load status options from existing schedules
  const loadStatusOptions = async () => {
    try {
      const response = await courseSectionAPI.getAllSections();
      const uniqueStatuses = [...new Set(response.data.map(section => section.status).filter(Boolean))];
      
      // If no statuses found in data, provide default options
      if (uniqueStatuses.length === 0) {
        setStatusOptions(['ACTIVE', 'CANCELLED', 'COMPLETED', 'FULL']);
      } else {
        setStatusOptions(uniqueStatuses.sort());
      }
    } catch (err) {
      console.error('Error loading status options:', err);
      // Fallback to minimal status options
      setStatusOptions(['ACTIVE', 'CANCELLED']);
    }
  };

  // Form handlers
  const handleScheduleFormChange = (field, value) => {
    setScheduleForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add new schedule
  const handleAddSchedule = async () => {
    try {
      // Validate required fields
      if (!scheduleForm.course || !scheduleForm.sectionName || !scheduleForm.instructor || 
          !scheduleForm.room || !scheduleForm.day || !scheduleForm.startTime || !scheduleForm.endTime) {
        alert('Please fill in all required fields.');
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
        faculty: { facultyID: selectedFaculty?.value }
      };

      await courseSectionAPI.createSection(sectionData);
      alert('Schedule added successfully!');
      closeAddScheduleModal();
      loadSchedules(); // Reload the list
      loadStatusOptions(); // Reload status options in case new status was added
    } catch (error) {
      console.error('Error adding schedule:', error);
      if (error.response?.status === 400) {
        alert(error.response.data || 'Invalid schedule data provided!');
      } else {
        alert('Failed to add schedule. Please try again.');
      }
    }
  };

  // Edit schedule
  const showEditScheduleForm = (schedule) => {
    setEditingSchedule(schedule);
    
    // Find the course value for the dropdown
    const courseOption = courseOptions.find(c => c.label.includes(schedule.course));
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
      alert('Schedule updated successfully!');
      closeEditScheduleModal();
      loadSchedules();
      loadStatusOptions(); // Reload status options in case status was changed
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Failed to update schedule. Please try again.');
    }
  };

  // Delete schedule
  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await courseSectionAPI.deleteSection(scheduleId);
        alert('Schedule deleted successfully!');
        loadSchedules();
        loadStatusOptions(); // Reload status options after deletion
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Failed to delete schedule. Please try again.');
      }
    }
  };

  // Update status
  const handleUpdateStatus = async (scheduleId, newStatus) => {
    try {
      await courseSectionAPI.updateSectionStatus(scheduleId, newStatus);
      alert('Status updated successfully!');
      loadSchedules();
      loadStatusOptions(); // Reload status options in case new status was used
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
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

  // Filter schedules
  const filteredSchedules = scheduleList.filter(schedule => {
    const matchesSearch = schedule.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.room.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter.type === 'all' || 
                         (filter.type === 'status' && schedule.status === filter.value) ||
                         (filter.type === 'day' && schedule.day === filter.value) ||
                         (filter.type === 'instructor' && schedule.instructor === filter.value);
    
    return matchesSearch && matchesFilter;
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
          userInfo={{ name: "David Anderson", role: "Schedule Admin" }}
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
          userInfo={{ name: "David Anderson", role: "Schedule Admin" }}
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
                <button onClick={loadSchedules} className="btn btn-primary">
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
      <Sidebar 
        onNavigate={showSection}
        userInfo={{ name: "David Anderson", role: "Schedule Admin" }}
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

          {/* Dynamic Statistics Cards */}
          <div className="schedule-stats">
        <div className="stat-card">
          <h3 className="stat-label">Total Schedules</h3>
          <div className="stat-value">{totalSchedules}</div>
        </div>
        <div className="stat-card">
          <h3 className="stat-label">Active</h3>
          <div className="stat-value">{activeSchedules}</div>
        </div>
        <div className="stat-card">
          <h3 className="stat-label">Completed</h3>
          <div className="stat-value">{completedSchedules}</div>
        </div>
        <div className="stat-card">
          <h3 className="stat-label">Cancelled</h3>
          <div className="stat-value">{cancelledSchedules}</div>
        </div>
      </div>

          {/* Search and Filter */}
          <div className="schedule-controls">
            <div className="search-group">
              <input
                type="text"
                className="form-input search-input"
                placeholder="Search schedules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="schedule-filter-group">
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
          <div className="schedule-table-container">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Schedule ID</th>
                  <th>Course & Section</th>
                  <th>Instructor</th>
                  <th>Room</th>
                  <th>Day & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td className="schedule-id">{schedule.id}</td>
                    <td className="course-section">
                      <div className="course-name">{schedule.course}</div>
                      <div className="section-name">{schedule.section}</div>
                    </td>
                    <td className="instructor">{schedule.instructor}</td>
                    <td className="room">{schedule.room}</td>
                    <td className="day-time">
                      <div className="day">{schedule.day}</div>
                      <div className="time">{schedule.timeFrom} - {schedule.timeTo}</div>
                    </td>
                    <td className="status">
                      <span className={`status-badge status-${schedule.status.toLowerCase()}`}>
                        {schedule.status}
                      </span>
                    </td>
                    <td className="actions">
                      <div className="action-buttons">
                        <button //Edit Button
                          className="btn-action btn-edit"
                          onClick={() => showEditScheduleForm(schedule)}
                          title="Edit Schedule"
                        >
                        </button>
                        <button   //Delete Button
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          title="Delete Schedule"
                        >
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., CS-101-A"
                    value={scheduleForm.sectionName}
                    onChange={(e) => handleScheduleFormChange('sectionName', e.target.value)}
                  />
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
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., CS-101-A"
                    value={scheduleForm.sectionName}
                    onChange={(e) => handleScheduleFormChange('sectionName', e.target.value)}
                  />
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