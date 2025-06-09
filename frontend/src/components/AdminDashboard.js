import React, { useState} from 'react';
import './AdminDashboard.css';
import Sidebar from './Sidebar';

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

  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    courseName: '',
    program: '',
    status: 'Active'
  });

  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    course: '',
    section: '',
    instructor: '',
    room: '',
    day: '',
    timeFrom: '',
    timeTo: ''
  });

  const currentDate = new Date();
  const currentDay = currentDate.getDate();

  // Schedule data for the selected date
  const scheduleData = [];

  const programs = [
    'BS Computer Science',
    'BS Information Technology', 
    'BS Information Systems',
    'BS Entertainment and Multimedia Computing'
  ];

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

  // Course options for schedule
  const courseOptions = [
    'Computer Programming I',
    'Computer Programming II', 
    'Database Management',
    'Data Structures',
    'Network Administration',
    'Web Development',
    'Software Engineering'
  ];

  // Instructor options for schedule
  const instructorOptions = [
    'Emily Thompson',
    'James Chen', 
    'Sarah Martinez',
    'Michael Roberts',
    'Rachel Williams'
  ];

  // Room options for schedule
  const roomOptions = [
    'Room 101', 'Room 102', 'Room 201', 'Room 202', 'Room 301',
    'Lab 101', 'Lab 201', 'Lab 301', 'Auditorium A'
  ];

  // Day options for schedule
  const dayOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
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

  // Schedule Modal functions
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
  
  console.log('Adding schedule:', scheduleForm);
  alert('Schedule added successfully!');
  closeAddScheduleModal();
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

  // Course Modal functions
  const showAddCourseForm = () => {
    setCourseForm({
      courseCode: '',
      courseName: '',
      program: '',
      status: 'Active'
    });
    setShowAddCourseModal(true);
  };

  const closeAddCourseModal = () => {
    setShowAddCourseModal(false);
    setCourseForm({
      courseCode: '',
      courseName: '',
      program: '',
      status: 'Active'
    });
  };

  const handleCourseFormChange = (field, value) => {
    setCourseForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCourse = () => {
    // Validate required fields
    if (!courseForm.courseCode || !courseForm.courseName || !courseForm.program) {
      alert('Please fill in all required fields');
      return;
    }
    
    console.log('Adding course:', courseForm);
    alert('Course added successfully!');
    closeAddCourseModal();
  };

  const showScheduleManager = () => {
    setShowAddScheduleModal(true);
  };

  // Navigation
  const showSection = (section) => {
    switch(section){
        case 'Curriculum':
            window.location.href = '/curriculum-management';
                break;
        case 'Students':
            window.location.href = '/student-management';
                break;
        case 'Schedule':
            window.location.href = '/schedule-management';
                break;
        case 'Faculty':
            window.location.href = '/faculty-management';
                break;
        case 'Courses':
            window.location.href = '/course-management';
                break;
        default:
            alert(`${section.charAt(0).toUpperCase() + section.slice(1)} section would be displayed here.`);
    }
  };

  const calendarDays = generateCalendarDays();
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar 
        activePage="Dashboard" 
        onNavigate={showSection}
        userInfo={{ name: "David Anderson", role: "Schedule Admin" }}        sections={[
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
              { id: 'Settings', label: 'Settings', icon: '⚙️', clickable: false },
              { id: 'AdminTools', label: 'Admin Tools', icon: '🔧', clickable: false }
            ]
          }
        ]}
      />

      {/* Main Content */}
      <div className="main-content">
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

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Course</h2>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Course Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Course Code (e.g., CS101)"
                    value={courseForm.courseCode}
                    onChange={(e) => handleCourseFormChange('courseCode', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Course Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Course Name"
                    value={courseForm.courseName}
                    onChange={(e) => handleCourseFormChange('courseName', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Program *</label>
                  <select
                    className="form-input"
                    value={courseForm.program}
                    onChange={(e) => handleCourseFormChange('program', e.target.value)}
                  >
                    <option value="">Select Program</option>
                    {programs.map((program) => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={courseForm.status}
                    onChange={(e) => handleCourseFormChange('status', e.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeAddCourseModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddCourse}>
                Add Course
              </button>
            </div>
          </div>
        </div>
      )}
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
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>
          
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
                  <label className="form-label">Time Period *</label>
                  <div style={{display: 'flex', gap: '10px'}}>
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
    </div>
  );
};

export default AdminDashboard;