import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.module.css';
import Sidebar from './StudentSidebar';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setStudentDashboardData] = useState({
    recentActivities: []
  });

  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showGraduationModal, setShowGraduationModal] = useState(false);
  
  const [enrollmentForm, setEnrollmentForm] = useState({
    studentId: '',
    semester: '',
    academicYear: '',
    courses: []
  });

  const [graduationForm, setGraduationForm] = useState({
    studentId: '',
    program: '',
    expectedGraduation: '',
    applicationDate: ''
  });

  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());

  // Generate calendar days for the selected month/year
  const generateCalendarDays = () => {
    const days = [];
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();

    // Previous month's ending days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        isSelected: day === selectedDate && calendarMonth === today.getMonth() && calendarYear === today.getFullYear(),
        isToday: day === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear()
      });
    }

    return days;
  };

  // Calendar navigation handlers
  const goToPrevMonth = () => {
    setCalendarMonth(prev => {
      if (prev === 0) {
        setCalendarYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
    setSelectedDate(1);
  };

  const goToNextMonth = () => {
    setCalendarMonth(prev => {
      if (prev === 11) {
        setCalendarYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
    setSelectedDate(1);
  };

  // Enrollment Modal functions
  const showEnrollmentForm = () => {
    setShowEnrollmentModal(true);
  };

  const closeEnrollmentModal = () => {
    setShowEnrollmentModal(false);
    setEnrollmentForm({
      studentId: '',
      semester: '',
      academicYear: '',
      courses: []
    });
  };

  const handleEnrollmentFormChange = (field, value) => {
    setEnrollmentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEnrollment = () => {
    // Validate required fields
    if (!enrollmentForm.studentId || !enrollmentForm.semester || !enrollmentForm.academicYear) {
      alert('Please fill in all required fields');
      return;
    }
    
    console.log('Processing enrollment:', enrollmentForm);
    alert('Enrollment processed successfully!');
    closeEnrollmentModal();
  };

  // Graduation Modal functions
  const showGraduationForm = () => {
    setShowGraduationModal(true);
  };

  const closeGraduationModal = () => {
    setShowGraduationModal(false);
    setGraduationForm({
      studentId: '',
      program: '',
      expectedGraduation: '',
      applicationDate: ''
    });
  };

  const handleGraduationFormChange = (field, value) => {
    setGraduationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGraduation = () => {
    // Validate required fields
    if (!graduationForm.studentId || !graduationForm.program || !graduationForm.expectedGraduation) {
      alert('Please fill in all required fields');
      return;
    }
    
    console.log('Processing graduation application:', graduationForm);
    alert('Graduation application submitted successfully!');
    closeGraduationModal();
  };

  // Add these missing data arrays
  const scheduleData = [
    {
      id: 1,
      time: "8:00 AM",
      subject: "Mathematics",
      room: "Room 101",
      type: "blue"
    },
    {
      id: 2,
      time: "10:00 AM",
      subject: "Physics",
      room: "Lab 201",
      type: "green"
    },
    {
      id: 3,
      time: "2:00 PM",
      subject: "Chemistry",
      room: "Lab 301",
      type: "blue"
    }
  ];

  const semesterOptions = [
    "1st Semester",
    "2nd Semester", 
    "Summer"
  ];

  const academicYearOptions = [
    "2024-2025",
    "2025-2026",
    "2026-2027"
  ];

  const programs = [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Technology",
    "Bachelor of Engineering",
    "Bachelor of Science in Mathematics",
    "Bachelor of Arts",
    "Master of Science in Computer Science",
    "Master of Business Administration"
  ];

  // Navigation
  const showSection = (section) => {
    switch(section){
      case 'Dashboard':
        navigate('/student-dashboard');
        break;
      case 'StudentSchedule':
        navigate('/student-schedule');
        break;
      case 'Enrollment':
        alert("Enrollment page here");
        break;
      case 'StudentCurriculum':
        alert("Curriculum page here");
        break;
      case 'StudentGrades':
        alert("Grades page here");
        break;
      case 'StudentSettings':
        alert("Settings page here");
        break;
      default:
        // No action for unknown sections
    }
  };

  const calendarDays = generateCalendarDays();
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar 
        onNavigate={showSection}
        userInfo={{ name: "John Smith", role: "Student" }}
        sections={[
          {
            items: [{ id: 'Dashboard', label: 'Dashboard', icon: '📊' }]
          },
          {
            label: 'Management',
            items: [
              { id: 'StudentSchedule', label: 'Schedule', icon: '📅' },
              { id: 'Enrollment', label: 'Enrollment', icon: '📝' },
              { id: 'StudentCurriculum', label: 'Curriculum', icon: '📚' },
              { id: 'StudentGrades', label: 'Grades', icon: '📈' }
            ]
          },
          {
            label: 'System',
            items: [
              { id: 'StudentSettings', label: 'Settings', icon: '⚙️'}
            ]
          }
        ]}
      />

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-welcome-title">Welcome back, Student</h1>
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
                  <div className="dashboard-action-btn" onClick={showEnrollmentForm}>
                    <div className="dashboard-action-title">Enrollment for Next Sem</div>
                    <div className="dashboard-action-desc">Process student enrollment</div>
                  </div>
                  <div className="dashboard-action-btn" onClick={showGraduationForm}>
                    <div className="dashboard-action-title">Application for Graduation</div>
                    <div className="dashboard-action-desc">Submit graduation application</div>
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
                <div className="dashboard-calendar-month" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <button className="btn btn-secondary" style={{ minWidth: 0, padding: '4px 10px' }} onClick={goToPrevMonth}>&lt;</button>
                  <span>
                    {new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <button className="btn btn-secondary" style={{ minWidth: 0, padding: '4px 10px' }} onClick={goToNextMonth}>&gt;</button>
                </div>
                <div className="dashboard-calendar-grid">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="dashboard-calendar-day-header">{day}</div>
                  ))}
                  {calendarDays.map((dayObj, index) => {
                    let dayClasses = ['dashboard-calendar-day'];
                    if (dayObj.isCurrentMonth) dayClasses.push('dashboard-calendar-day-current-month');
                    if (dayObj.isSelected) dayClasses.push('dashboard-calendar-day-selected');
                    if (dayObj.isToday && !dayObj.isSelected) dayClasses.push('dashboard-calendar-day-today');
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

      {/* Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Enrollment for Next Semester</h2>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Student ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Student ID"
                    value={enrollmentForm.studentId}
                    onChange={(e) => handleEnrollmentFormChange('studentId', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Semester *</label>
                  <select
                    className="form-input"
                    value={enrollmentForm.semester}
                    onChange={(e) => handleEnrollmentFormChange('semester', e.target.value)}
                  >
                    <option value="">Select Semester</option>
                    {semesterOptions.map((semester) => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Academic Year *</label>
                  <select
                    className="form-input"
                    value={enrollmentForm.academicYear}
                    onChange={(e) => handleEnrollmentFormChange('academicYear', e.target.value)}
                  >
                    <option value="">Select Academic Year</option>
                    {academicYearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeEnrollmentModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEnrollment}>
                Process Enrollment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Graduation Modal */}
      {showGraduationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Application for Graduation</h2>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Student ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Student ID"
                    value={graduationForm.studentId}
                    onChange={(e) => handleGraduationFormChange('studentId', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Program *</label>
                  <select
                    className="form-input"
                    value={graduationForm.program}
                    onChange={(e) => handleGraduationFormChange('program', e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programs.map((program) => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Expected Graduation *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={graduationForm.expectedGraduation}
                    onChange={(e) => handleGraduationFormChange('expectedGraduation', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Application Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={graduationForm.applicationDate}
                    onChange={(e) => handleGraduationFormChange('applicationDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeGraduationModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleGraduation}>
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;