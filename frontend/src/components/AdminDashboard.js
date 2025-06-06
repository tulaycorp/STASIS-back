import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [dashboardData, setAdminDashboardData] = useState({
    stats: {
      totalStudents: '',
      totalFaculty: '',
      activeCourses: '',
      studentGrowth: '',
      facultyGrowth: '',
      courseGrowth: ''
    },
    recentActivities: []
  });

  const [selectedDate, setSelectedDate] = useState(11);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  
  const [studentForm, setStudentForm] = useState({
    studentId: '',
    email: '',
    firstName: '',
    lastName: '',
    middleName: '',
    birthday: ''
  });

  const [facultyForm, setFacultyForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    employmentStatus: ''
  });

  const currentDate = new Date();
  const currentDay = currentDate.getDate();

  // Schedule data for the selected date
  const scheduleData = [];

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
    'Engineering'
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

  // Generate calendar days for March 2025
  const generateCalendarDays = () => {
    const days = [];
    const firstDay = new Date(2025, 2, 1).getDay(); // March 1, 2025
    const daysInMonth = new Date(2025, 2 + 1, 0).getDate(); // Days in March
    
    // Previous month's ending days
    const prevMonthDays = new Date(2025, 2, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day: day,
        isCurrentMonth: true,
        isSelected: day === selectedDate,
        isToday: day === currentDay && currentDate.getMonth() === 2 && currentDate.getFullYear() === 2025
      });
    }
    
    return days;
  };

  // Student Modal functions
  const showAddStudentForm = () => {
    setShowAddStudentModal(true);
  };

  const closeAddStudentModal = () => {
    setShowAddStudentModal(false);
    setStudentForm({
      studentId: '',
      email: '',
      firstName: '',
      lastName: '',
      middleName: '',
      birthday: ''
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
    
    // Here you would typically send to API
    console.log('Adding student:', studentForm);
    alert('Student added successfully!');
    closeAddStudentModal();
  };

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
    
    // Here you would typically send to API
    console.log('Adding faculty:', facultyForm);
    alert('Faculty added successfully!');
    closeAddFacultyModal();
  };

  // Other quick action functions
  const showAddCourseForm = () => {
    const name = prompt('Enter course name:');
    const code = prompt('Enter course code:');
    const description = prompt('Enter course description:');
    
    if (name && code && description) {
      addCourse({ name, code, description });
    }
  };

  const showScheduleManager = () => {
    alert('Schedule manager functionality would be implemented here.');
  };

  // API functions
  const addCourse = async (courseData) => {
    alert('Course data saved locally (demo mode)');
  };

  // Navigation
  const showSection = (section) => {
    switch(section){
        case 'curriculum':
            window.location.href = '/curriculum-management';
                break;
        case 'students':
            window.location.href = '/student-management';
                break;
        case 'schedule':
            window.location.href = '/schedule';
                break;
        case 'faculty':
            window.location.href = '/faculty';
                break;
        case 'courses':
            window.location.href = '/courses';
                break;
        default:
            alert(`${section.charAt(0).toUpperCase() + section.slice(1)} section would be displayed here.`);
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">📊</div>
        </div>
        
        <div className="dashboard-nav-section">
          <div className="dashboard-nav-item dashboard-nav-item-active">Dashboard</div>
        </div>
        
        <div className="dashboard-nav-section">
          <div className="dashboard-nav-title">Management</div>
          <div className="dashboard-nav-item" onClick={() => showSection('students')}>Students</div>
          <div className="dashboard-nav-item" onClick={() => showSection('curriculum')}>Curriculum</div>
          <div className="dashboard-nav-item" onClick={() => showSection('schedule')}>Schedule</div>
          <div className="dashboard-nav-item" onClick={() => showSection('faculty')}>Faculty</div>
          <div className="dashboard-nav-item" onClick={() => showSection('courses')}>Courses</div>
        </div>
        
        <div className="dashboard-nav-section">
          <div className="dashboard-nav-title">System</div>
          <div className="dashboard-nav-item">Settings</div>
          <div className="dashboard-nav-item">Admin Tools</div>
        </div>
        
        <div className="dashboard-user-info">
          <strong>Admin Name</strong><br />
          Faculty Admin
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-welcome-title">Welcome back, Admin</h1>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-title">Total Students</div>
            <div className="dashboard-stat-value">{dashboardData.stats.totalStudents.toLocaleString()}</div>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-title">Total Faculty</div>
            <div className="dashboard-stat-value">{dashboardData.stats.totalFaculty}</div>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-title">Active Courses</div>
            <div className="dashboard-stat-value">{dashboardData.stats.activeCourses}</div>
          </div>
        </div>

        {/* Content Wrapper */}
        <div className="dashboard-content-wrapper">
          {/* Main Left Section */}
          <div className="dashboard-main-section">
            <div className="dashboard-main-grid">
              {/* Quick Actions */}
              <div className="dashboard-section-card">
                <div className="dashboard-section-header">
                  <h2 className="dashboard-section-title">Quick Actions</h2>
                </div>
                <div className="dashboard-actions-grid">
                  <div className="dashboard-action-btn" onClick={showAddStudentForm}>
                    <div className="dashboard-action-title">Add Student</div>
                    <div className="dashboard-action-desc">Create new student profile</div>
                  </div>
                  <div className="dashboard-action-btn" onClick={showAddFacultyForm}>
                    <div className="dashboard-action-title">Add Faculty</div>
                    <div className="dashboard-action-desc">Register new faculty member</div>
                  </div>
                  <div className="dashboard-action-btn" onClick={showAddCourseForm}>
                    <div className="dashboard-action-title">Add Course</div>
                    <div className="dashboard-action-desc">Create new course</div>
                  </div>
                  <div className="dashboard-action-btn" onClick={showScheduleManager}>
                    <div className="dashboard-action-title">Schedule</div>
                    <div className="dashboard-action-desc">Manage class schedules</div>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="dashboard-section-card">
                <div className="dashboard-section-header">
                  <h2 className="dashboard-section-title">Recent Activities</h2>
                </div>
                <div className="dashboard-activity-list">
                  {dashboardData.recentActivities.map((activity) => (
                    <div key={activity.id} className="dashboard-activity-item">
                      <div className="dashboard-activity-content">
                        <div className="dashboard-activity-message">{activity.message}</div>
                        <div className="dashboard-activity-time">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="dashboard-right-sidebar">
            {/* Calendar */}
            <div className="dashboard-calendar-section">
              <div className="dashboard-calendar-header-section">
                <h2 className="dashboard-calendar-title">Calendar</h2>
              </div>
              <div className="dashboard-calendar-content">
                <div className="dashboard-calendar-month">March 2025</div>
                <div className="dashboard-calendar-grid">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="dashboard-calendar-day-header">{day}</div>
                  ))}
                  
                  {calendarDays.map((dayObj, index) => {
                    let dayClasses = ['dashboard-calendar-day'];
                    
                    if (dayObj.isCurrentMonth) {
                      dayClasses.push('dashboard-calendar-day-current-month');
                    }
                    if (dayObj.isSelected) {
                      dayClasses.push('dashboard-calendar-day-selected');
                    }
                    if (dayObj.isToday && !dayObj.isSelected) {
                      dayClasses.push('dashboard-calendar-day-today');
                    }
                    
                    return (
                      <div
                        key={index}
                        className={dayClasses.join(' ')}
                        onClick={() => dayObj.isCurrentMonth && setSelectedDate(dayObj.day)}
                      >
                        {dayObj.day}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Upcoming Schedule */}
            <div className="dashboard-section-card">
              <div className="dashboard-schedule-header-section">
                <h2 className="dashboard-schedule-title">Upcoming Schedule</h2>
              </div>
              <div className="dashboard-schedule-content">
                {scheduleData.map((item) => (
                  <div 
                    key={item.id} 
                    className={`dashboard-schedule-item ${item.type === 'blue' ? 'dashboard-schedule-item-blue' : item.type === 'green' ? 'dashboard-schedule-item-green' : ''}`}
                  >
                    <div className="dashboard-schedule-time">{item.time}</div>
                    <div className="dashboard-schedule-subject">{item.subject}</div>
                    <div className="dashboard-schedule-room">{item.room}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            {/* Modal Header */}
            <div className="modal-header">
              <h2 className="modal-title">Add New Student</h2>
            </div>
            
            {/* Modal Content */}
            <div className="modal-body">
              <div className="modal-grid">
                {/* Student ID */}
                <div className="form-group">
                  <label className="form-label">Student ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Student ID"
                    value={studentForm.studentId}
                    onChange={(e) => handleStudentFormChange('studentId', e.target.value)}
                  />
                </div>
                
                {/* Email */}
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter Student Email"
                    value={studentForm.email}
                    onChange={(e) => handleStudentFormChange('email', e.target.value)}
                  />
                </div>
                
                {/* First Name */}
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter First Name"
                    value={studentForm.firstName}
                    onChange={(e) => handleStudentFormChange('firstName', e.target.value)}
                  />
                </div>
                
                {/* Last Name */}
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Last Name"
                    value={studentForm.lastName}
                    onChange={(e) => handleStudentFormChange('lastName', e.target.value)}
                  />
                </div>
                
                {/* Middle Name */}
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
                
                {/* Birthday */}
                <div className="form-group">
                  <label className="form-label">Birthday</label>
                  <input
                    type="date"
                    className="form-input"
                    value={studentForm.birthday}
                    onChange={(e) => handleStudentFormChange('birthday', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeAddStudentModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddStudent}>
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Faculty Modal */}
      {showAddFacultyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            {/* Modal Header */}
            <div className="modal-header">
              <h2 className="modal-title">Add New Faculty</h2>
            </div>
            
            {/* Modal Content */}
            <div className="modal-body">
              <div className="modal-grid">
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
                    className="form-input" value={facultyForm.department}
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
                    className="form-input" value={facultyForm.position}
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
                    className="form-input" value={facultyForm.employmentStatus}
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
              <button className="btn btn-secondary" onClick={closeAddFacultyModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddFaculty}>
                Add Faculty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;