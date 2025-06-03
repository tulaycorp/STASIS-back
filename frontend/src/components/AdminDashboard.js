import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';


const AdminDashboard = () => {
  const [dashboardData, setAdminDashboardData] = useState({
    stats: {
      totalStudents: 2453,
      totalFaculty: 156,
      activeCourses: 48,
      studentGrowth: 7.2,
      facultyGrowth: 1.3,
      courseGrowth: 0
    },
    recentActivities: [
    //recent activities
    ]
  });

  const [selectedDate, setSelectedDate] = useState(11);
  const currentDate = new Date();
  const currentDay = currentDate.getDate();

  // Schedule data for the selected date
  const scheduleData = [
    //schedule data here
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

  // Quick action functions
  const showAddStudentForm = () => {
    const name = prompt('Enter student name:');
    const email = prompt('Enter student email:');
    const course = prompt('Enter course:');
    
    if (name && email && course) {
      addStudent({ name, email, course });
    }
  };

  const showAddFacultyForm = () => {
    const name = prompt('Enter faculty name:');
    const email = prompt('Enter faculty email:');
    const department = prompt('Enter department:');
    
    if (name && email && department) {
      addFaculty({ name, email, department });
    }
  };

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
  const addStudent = async (studentData) => {
    alert('Student data saved locally (demo mode)');
  };

  const addFaculty = async (facultyData) => {
    alert('Faculty data saved locally (demo mode)');
  };

  const addCourse = async (courseData) => {
    alert('Course data saved locally (demo mode)');
  };

  // Navigation
  const showSection = (section) => {
    switch(section){
        case 'curriculum':
            window.location.href = '/curricullum-management';
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
            <div className="dashboard-stat-change">+{dashboardData.stats.studentGrowth}% from last month</div>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-title">Total Faculty</div>
            <div className="dashboard-stat-value">{dashboardData.stats.totalFaculty}</div>
            <div className="dashboard-stat-change">+{dashboardData.stats.facultyGrowth}% from last month</div>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-title">Active Courses</div>
            <div className="dashboard-stat-value">{dashboardData.stats.activeCourses}</div>
            <div className="dashboard-stat-change" style={{color: '#6c757d'}}>
              Same as last month
            </div>
          </div>
        </div>

        {/* Content Wrapper with Three Columns */}
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

          {/* Right Sidebar Section */}
          <div className="dashboard-right-sidebar">
            {/* Calendar in Upper Right */}
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
                    if (dayObj.isToday) {
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
                {scheduleData.map((item) => {
                  let scheduleClasses = ['dashboard-schedule-item'];
                  
                  if (item.type === 'blue') {
                    scheduleClasses.push('dashboard-schedule-item-blue');
                  } else if (item.type === 'green') {
                    scheduleClasses.push('dashboard-schedule-item-green');
                  }
                  
                  return (
                    <div key={item.id} className={scheduleClasses.join(' ')}>
                      {item.isToday && (
                        <div className="dashboard-schedule-today-badge">Today</div>
                      )}
                      <div className="dashboard-schedule-time">{item.time}</div>
                      <div className="dashboard-schedule-subject">{item.subject}</div>
                      <div className="dashboard-schedule-room">{item.room}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;