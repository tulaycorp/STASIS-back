// At the top, add createPortal to your React import
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import './ScheduleManagement.css';
import Sidebar from './Sidebar';

// --- NEW DEDICATED DROPDOWN COMPONENT ---
// This component encapsulates all the logic for the portal-based dropdown
const FilterDropdown = ({ filter, onFilterSelect, dayOptions, programOptions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({});
  
  const buttonRef = useRef(null); // Ref for the trigger button
  const dropdownRef = useRef(null); // Ref for the dropdown menu itself

  // This effect calculates the dropdown's position when it opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width, // Set dropdown width to match button width
      });
    }
  }, [isOpen]);

  // This effect handles clicks outside the component to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        buttonRef.current && !buttonRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setOpenSubMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);


  const handleToggle = () => {
    setIsOpen(prev => !prev);
    if(isOpen) setOpenSubMenu(null); // Reset submenu when closing
  };

  const handleSubMenuToggle = (menu) => {
    setOpenSubMenu(prev => (prev === menu ? null : menu));
  };

  const handleSelect = (type, value) => {
    onFilterSelect(type, value);
    setIsOpen(false);
    setOpenSubMenu(null);
  };

  const DropdownMenu = () => (
    <ul 
      ref={dropdownRef}
      className="primary-dropdown" 
      style={menuPosition}
    >
      <li 
        className="primary-dropdown-item" 
        onClick={() => handleSubMenuToggle('days')}
      >
        <span>Days</span>
        <ul className={`secondary-dropdown ${openSubMenu === 'days' ? 'open' : ''}`}>
          <li
            className={`secondary-dropdown-item ${filter.type === 'all' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleSelect('all', 'All') }}
          >
            All Days
          </li>
          {dayOptions.map(day => (
            <li
              key={day}
              className={`secondary-dropdown-item ${filter.type === 'day' && filter.value === day ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleSelect('day', day) }}
            >
              {day}
            </li>
          ))}
        </ul>
      </li>
      <li 
        className="primary-dropdown-item"
        onClick={() => handleSubMenuToggle('programs')}
      >
        <span>Programs</span>
        <ul className={`secondary-dropdown ${openSubMenu === 'programs' ? 'open' : ''}`}>
          <li
            className={`secondary-dropdown-item ${filter.type === 'all' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleSelect('all', 'All') }}
          >
            All Programs
          </li>
          {programOptions.map(program => (
            <li
              key={program}
              className={`secondary-dropdown-item ${filter.type === 'program' && filter.value === program ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleSelect('program', program) }}
            >
              {program}
            </li>
          ))}
        </ul>
      </li>
    </ul>
  );

  return (
    <div className="filter-dropdown-container">
      <button 
        ref={buttonRef}
        className="filter-button" 
        onClick={handleToggle}
      >
        {filter.type === 'all' 
          ? 'Filter' 
          : `${filter.type.charAt(0).toUpperCase() + filter.type.slice(1)}: ${filter.value}`
        }
      </button>
      {isOpen && createPortal(<DropdownMenu />, document.getElementById('portal-root'))}
    </div>
  );
};


// --- MAIN SCHEDULE MANAGEMENT COMPONENT ---
const ScheduleManagement = () => {
  // ... (all your existing state and functions up to the return statement) ...
  // No need for isFilterOpen, openSubMenu, or filterRef states here anymore
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    course: '',
    section: '',
    instructor: '',
    room: '',
    day: '',
    timeFrom: '',
    timeTo: ''
  });

  // Sample schedule data
  const [scheduleList, setScheduleList] = useState([
    {
      id: 'SCH001',
      course: 'Computer Programming I',
      section: 'CS-101-A',
      instructor: 'Emily Thompson',
      room: 'Room 204',
      day: 'Monday',
      timeFrom: '08:00',
      timeTo: '10:00',
      status: 'Active'
    },
    {
      id: 'SCH002',
      course: 'Database Management',
      section: 'IT-201-B',
      instructor: 'James Chen',
      room: 'Lab 301',
      day: 'Tuesday',
      timeFrom: '10:00',
      timeTo: '12:00',
      status: 'Active'
    },
    {
      id: 'SCH003',
      course: 'Business Ethics',
      section: 'BA-105-A',
      instructor: 'Sarah Martinez',
      room: 'Room 105',
      day: 'Wednesday',
      timeFrom: '14:00',
      timeTo: '16:00',
      status: 'Active'
    },
    {
      id: 'SCH004',
      course: 'Engineering Mathematics',
      section: 'ENG-102-C',
      instructor: 'Michael Roberts',
      room: 'Room 307',
      day: 'Thursday',
      timeFrom: '09:00',
      timeTo: '11:00',
      status: 'Active'
    },
    {
      id: 'SCH005',
      course: 'General Psychology',
      section: 'PSY-101-A',
      instructor: 'Rachel Williams',
      room: 'Room 201',
      day: 'Friday',
      timeFrom: '13:00',
      timeTo: '15:00',
      status: 'Cancelled'
    },
    {
      id: 'SCH006',
      course: 'Data Structures',
      section: 'CS-201-B',
      instructor: 'Emily Thompson',
      room: 'Lab 205',
      day: 'Monday',
      timeFrom: '15:00',
      timeTo: '17:00',
      status: 'Active'
    },
    {
      id: 'SCH007',
      course: 'Network Administration',
      section: 'IT-301-A',
      instructor: 'James Chen',
      room: 'Lab 302',
      day: 'Wednesday',
      timeFrom: '08:00',
      timeTo: '10:00',
      status: 'Completed'
    },
    {
      id: 'SCH008',
      course: 'Financial Accounting',
      section: 'BA-201-C',
      instructor: 'Sarah Martinez',
      room: 'Room 106',
      day: 'Friday',
      timeFrom: '10:00',
      timeTo: '12:00',
      status: 'Active'
    }
  ]);

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({ type: 'all', value: 'All' });


  // Course options (used for "Programs" filter)
  const courseOptions = [
    'Computer Programming I',
    'Computer Programming II',
    'Database Management',
    'Data Structures',
    'Network Administration',
    'Web Development',
    'Software Engineering',
    'Business Ethics',
    'Financial Accounting',
    'Marketing Management',
    'Engineering Mathematics',
    'Physics I',
    'Chemistry Lab',
    'General Psychology',
    'Research Methods'
  ];

  // Instructor options
  const instructorOptions = [
    'Emily Thompson',
    'James Chen',
    'Sarah Martinez',
    'Michael Roberts',
    'Rachel Williams',
    'David Johnson',
    'Lisa Anderson',
    'Mark Wilson',
    'Jennifer Brown',
    'Robert Garcia'
  ];

  // Room options
  const roomOptions = [
    'Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105',
    'Room 201', 'Room 202', 'Room 203', 'Room 204', 'Room 205',
    'Room 301', 'Room 302', 'Room 303', 'Room 304', 'Room 305',
    'Lab 101', 'Lab 102', 'Lab 201', 'Lab 202', 'Lab 301', 'Lab 302',
    'Auditorium A', 'Auditorium B', 'Conference Room'
  ];

  // Day options
  const dayOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // Statistics calculations
  const totalSchedules = scheduleList.length;
  const activeSchedules = scheduleList.filter(s => s.status === 'Active').length;
  const completedSchedules = scheduleList.filter(s => s.status === 'Completed').length;
  const cancelledSchedules = scheduleList.filter(s => s.status === 'Cancelled').length;

  // Filter selection handler (now simpler)
  const handleFilterSelect = (type, value) => {
    setFilter({ type, value });
  };
  
  // Filter schedules based on search and new filter state
  const filteredSchedules = scheduleList.filter(schedule => {
    const matchesSearch = 
      searchTerm === '' ||
      schedule.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      (filter.type === 'all') ||
      (filter.type === 'day' && schedule.day === filter.value) ||
      (filter.type === 'program' && schedule.course === filter.value);

    return matchesSearch && matchesFilter;
  });

  // Add Schedule Modal functions
  const showAddScheduleForm = () => {
    setShowAddScheduleModal(true);
  };

  const closeAddScheduleModal = () => {
    setShowAddScheduleModal(false);
    setScheduleForm({
      course: '',
      section: '',
      instructor: '',
      room: '',
      day: '',
      timeFrom: '',
      timeTo: ''
    });
  };

  // Edit Schedule Modal functions
  const showEditScheduleForm = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      course: schedule.course,
      section: schedule.section,
      instructor: schedule.instructor,
      room: schedule.room,
      day: schedule.day,
      timeFrom: schedule.timeFrom,
      timeTo: schedule.timeTo
    });
    setShowEditScheduleModal(true);
  };

  const closeEditScheduleModal = () => {
    setShowEditScheduleModal(false);
    setEditingSchedule(null);
    setScheduleForm({
      course: '',
      section: '',
      instructor: '',
      room: '',
      day: '',
      timeFrom: '',
      timeTo: ''
    });
  };

  const handleScheduleFormChange = (field, value) => {
    setScheduleForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSchedule = () => {
    // Validate required fields
    if (!scheduleForm.course || !scheduleForm.section || !scheduleForm.instructor || 
        !scheduleForm.room || !scheduleForm.day || !scheduleForm.timeFrom || !scheduleForm.timeTo) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate time
    if (scheduleForm.timeFrom >= scheduleForm.timeTo) {
      alert('End time must be after start time');
      return;
    }
    
    // Generate new schedule ID
    const newId = `SCH${String(scheduleList.length + 1).padStart(3, '0')}`;
    
    // Create new schedule object
    const newSchedule = {
      id: newId,
      course: scheduleForm.course,
      section: scheduleForm.section,
      instructor: scheduleForm.instructor,
      room: scheduleForm.room,
      day: scheduleForm.day,
      timeFrom: scheduleForm.timeFrom,
      timeTo: scheduleForm.timeTo,
      status: 'Active'
    };
    
    // Add to schedule list
    setScheduleList(prev => [...prev, newSchedule]);
    
    alert('Schedule added successfully!');
    closeAddScheduleModal();
  };

  const handleEditSchedule = () => {
    // Validate required fields
    if (!scheduleForm.course || !scheduleForm.section || !scheduleForm.instructor || 
        !scheduleForm.room || !scheduleForm.day || !scheduleForm.timeFrom || !scheduleForm.timeTo) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate time
    if (scheduleForm.timeFrom >= scheduleForm.timeTo) {
      alert('End time must be after start time');
      return;
    }
    
    // Create updated schedule object
    const updatedSchedule = {
      ...editingSchedule,
      course: scheduleForm.course,
      section: scheduleForm.section,
      instructor: scheduleForm.instructor,
      room: scheduleForm.room,
      day: scheduleForm.day,
      timeFrom: scheduleForm.timeFrom,
      timeTo: scheduleForm.timeTo
    };
    
    // Update schedule list
    setScheduleList(prev => 
      prev.map(schedule => 
        schedule.id === editingSchedule.id ? updatedSchedule : schedule
      )
    );
    
    alert('Schedule updated successfully!');
    closeEditScheduleModal();
  };

  const handleDeleteSchedule = (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      setScheduleList(prev => prev.filter(schedule => schedule.id !== scheduleId));
      alert('Schedule deleted successfully!');
    }
  };

  // Format time for display
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
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
                
                <div className="page-header">
                    <h1 className="page-title">Schedule Management</h1>
                    <button 
                    onClick={showAddScheduleForm}
                    className="add-schedule-btn"
                    >
                    + Add New Schedule
                    </button>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Total Schedules</div>
                        <div className="stat-value">{totalSchedules}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Active</div>
                        <div className="stat-value">{activeSchedules}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Completed</div>
                        <div className="stat-value">{completedSchedules}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Cancelled</div>
                        <div className="stat-value">{cancelledSchedules}</div>
                    </div>
                </div>
                
                <div className="schedule-list-container">
                    <div className="list-header">
                        <div className="list-controls">
                            <h2 className="list-title">Schedule List</h2>
                            <div className="controls">
                                <FilterDropdown
                                    filter={filter}
                                    onFilterSelect={handleFilterSelect}
                                    dayOptions={dayOptions}
                                    programOptions={courseOptions}
                                />
                                <input
                                    type="text"
                                    placeholder="Search schedules..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                        </div>
                    </div>
                    {/* ... a lot of closing tags and the rest of the component ... */}
                                <div className="table-container">
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
                  {filteredSchedules.map((schedule, index) => (
                    <tr key={schedule.id}>
                      <td>{schedule.id}</td>
                      <td>
                        <div className="schedule-info">
                          <div className="schedule-course">{schedule.course}</div>
                          <div className="schedule-section">{schedule.section}</div>
                        </div>
                      </td>
                      <td>{schedule.instructor}</td>
                      <td>{schedule.room}</td>
                      <td>
                        <div className="time-info">
                          <div className="time-period">
                            {formatTime(schedule.timeFrom)} - {formatTime(schedule.timeTo)}
                          </div>
                          <div className="day-info">{schedule.day}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${
                          schedule.status === 'Active' ? 'status-active' : 
                          schedule.status === 'Completed' ? 'status-completed' : 
                          'status-cancelled'
                        }`}>
                          {schedule.status}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <button 
                          className="btn-edit"
                          onClick={() => showEditScheduleForm(schedule)}
                        >
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteSchedule(schedule.id)}
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
                Showing 1 to {filteredSchedules.length} of {totalSchedules} entries
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
        {/* Modals go here as before */}
        {showAddScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            {/* Modal Header */}
            <div className="modal-header">
              <h2 className="modal-title">Add New Schedule</h2>
            </div>
            
            {/* Modal Content */}
            <div className="modal-content">
              <div className="form-grid">
                {/* Course */}
                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.course}
                    onChange={(e) => handleScheduleFormChange('course', e.target.value)}
                  >
                    <option value="">Select course</option>
                    {courseOptions.map((course) => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>
                
                {/* Section */}
                <div className="form-group">
                  <label className="form-label">Section *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., CS-101-A"
                    value={scheduleForm.section}
                    onChange={(e) => handleScheduleFormChange('section', e.target.value)}
                  />
                </div>
                
                {/* Instructor */}
                <div className="form-group">
                  <label className="form-label">Instructor *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.instructor}
                    onChange={(e) => handleScheduleFormChange('instructor', e.target.value)}
                  >
                    <option value="">Select instructor</option>
                    {instructorOptions.map((instructor) => (
                      <option key={instructor} value={instructor}>{instructor}</option>
                    ))}
                  </select>
                </div>
                
                {/* Room */}
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
                
                {/* Day */}
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
                
                {/* Time Period */}
                <div className="form-group">
                  <label className="form-label">Time Period *</label>
                  <div className="time-inputs">
                    <input
                      type="time"
                      className="form-input"
                      value={scheduleForm.timeFrom}
                      onChange={(e) => handleScheduleFormChange('timeFrom', e.target.value)}
                    />
                    <input
                      type="time"
                      className="form-input"
                      value={scheduleForm.timeTo}
                      onChange={(e) => handleScheduleFormChange('timeTo', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={closeAddScheduleModal}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddSchedule}
              >
                Add Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEditScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            {/* Modal Header */}
            <div className="modal-header">
              <h2 className="modal-title">Edit Schedule</h2>
            </div>
            
            {/* Modal Content */}
            <div className="modal-content">
              <div className="form-grid">
                {/* Course */}
                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.course}
                    onChange={(e) => handleScheduleFormChange('course', e.target.value)}
                  >
                    <option value="">Select course</option>
                    {courseOptions.map((course) => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>
                
                {/* Section */}
                <div className="form-group">
                  <label className="form-label">Section *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., CS-101-A"
                    value={scheduleForm.section}
                    onChange={(e) => handleScheduleFormChange('section', e.target.value)}
                  />
                </div>
                
                {/* Instructor */}
                <div className="form-group">
                  <label className="form-label">Instructor *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.instructor}
                    onChange={(e) => handleScheduleFormChange('instructor', e.target.value)}
                  >
                    <option value="">Select instructor</option>
                    {instructorOptions.map((instructor) => (
                      <option key={instructor} value={instructor}>{instructor}</option>
                    ))}
                  </select>
                </div>
                
                {/* Room */}
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
                
                {/* Day */}
                <div className="form-group">
                  <label className="form-label">Day *</label>
                  <select
                    className="form-input"
                    value={scheduleForm.day}
                    onChange={(e) => handleScheduleFormChange('day', e.g.target.value)}
                  >
                    <option value="">Select day</option>
                    {dayOptions.map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                
                {/* Time Period */}
                <div className="form-group">
                  <label className="form-label">Time Period *</label>
                  <div className="time-inputs">
                    <input
                      type="time"
                      className="form-input"
                      value={scheduleForm.timeFrom}
                      onChange={(e) => handleScheduleFormChange('timeFrom', e.target.value)}
                    />
                    <input
                      type="time"
                      className="form-input"
                      value={scheduleForm.timeTo}
                      onChange={(e) => handleScheduleFormChange('timeTo', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={closeEditScheduleModal}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleEditSchedule}
              >
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