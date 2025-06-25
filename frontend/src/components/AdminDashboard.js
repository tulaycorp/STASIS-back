import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import Sidebar from './Sidebar';
import { useAdminData } from '../hooks/useAdminData';
import { facultyAPI, programAPI, studentAPI } from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { getAdminName, getUserInfo } = useAdminData();
  
  // State to hold the fetched lists
  const [facultyList, setFacultyList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [studentCount, setStudentCount] = useState(0); 
  const [programsLoaded, setProgramsLoaded] = useState(false);

  const [dashboardData, setAdminDashboardData] = useState({
    stats: {
      totalStudents: 0, 
      studentGrowth: '',
      facultyGrowth: '',
      courseGrowth: ''
    },
    recentActivities: []
  });

  // Fetch all necessary data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch all data in parallel
        const [facultyResponse, programResponse, studentCountResponse] = await Promise.all([
          facultyAPI.getAllFaculty(),
          programAPI.getAllPrograms(),
          studentAPI.getStudentCount()
        ]);
        
        setFacultyList(facultyResponse.data);
        setProgramsList(programResponse.data);
        setStudentCount(studentCountResponse.data.count);
        setProgramsLoaded(true);
        setAdminDashboardData(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            totalStudents: studentCountResponse.data.count
          }
        }));
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };
    loadData();
  }, []);

  // Student Form State and Handlers
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    year_level: 1,
    programId: ''
  });

  const showAddStudentForm = () => {
    setStudentForm({
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      year_level: 1,
      programId: ''
    });
    setShowAddStudentModal(true);
  };

  const closeAddStudentModal = () => {
    setShowAddStudentModal(false);
  };

  const handleStudentFormChange = (field, value) => {
    setStudentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddStudent = async () => {
    // Validate required fields
    if (!studentForm.firstName || !studentForm.lastName || !studentForm.email) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentForm.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      // Find the selected program object
      const selectedProgramObj = programsList.find(p => p.programID.toString() === studentForm.programId);

      const studentData = {
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        email: studentForm.email,
        dateOfBirth: studentForm.dateOfBirth,
        year_level: parseInt(studentForm.year_level),
        program: selectedProgramObj || null
      };

      await studentAPI.createStudent(studentData);
      alert('Student added successfully!');
      closeAddStudentModal();
      
      // Refresh student count
      const countResponse = await studentAPI.getStudentCount();
      setStudentCount(countResponse.data.count);
      setAdminDashboardData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          totalStudents: countResponse.data.count
        }
      }));
    } catch (error) {
      console.error('Error adding student:', error);
      if (error.response?.status === 400) {
        alert('Email already exists or invalid data provided!');
      } else {
        alert('Failed to add student. Please try again.');
      }
    }
  };

  // Faculty Modal State and Handlers
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [facultyForm, setFacultyForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    employmentStatus: ''
  });

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
    
    console.log('Adding faculty:', facultyForm);
    alert('Faculty added successfully!');
    closeAddFacultyModal();
  };

  // Course Modal State and Handlers
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    courseName: '',
    program: '',
    status: 'Active'
  });

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

  // Schedule Modal State and Handlers
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

  const showScheduleManager = () => {
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

  // Calendar State and Handlers
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());

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

  // Static data options
  const departmentOptions = [
    "Computer Science",
    "Information Technology",
    "Engineering",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Business Administration",
    "Liberal Arts"
  ];

  const positionOptions = [
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Instructor",
    "Lecturer",
    "Department Head",
    "Dean"
  ];

  const employmentStatusOptions = [
    "Full-time",
    "Part-time",
    "Contract",
    "Adjunct"
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

  const courseOptions = [
    "CS101 - Introduction to Programming",
    "CS102 - Data Structures",
    "MATH101 - Calculus I",
    "PHYS101 - General Physics",
    "CHEM101 - General Chemistry"
  ];

  const instructorOptions = [
    "Dr. John Smith",
    "Prof. Jane Doe",
    "Dr. Michael Johnson",
    "Prof. Sarah Wilson",
    "Dr. David Brown"
  ];

  const roomOptions = [
    "Room 101",
    "Room 102",
    "Lab 201",
    "Lab 202",
    "Lecture Hall A",
    "Lecture Hall B",
    "Computer Lab 1",
    "Computer Lab 2"
  ];

  const dayOptions = [
    "Monday",
    "Tuesday", 
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  // Navigation
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

  const calendarDays = generateCalendarDays();
  
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-welcome-title">Welcome back, {getAdminName()}</h1>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-title">Total Students</div>
            <div className="dashboard-stat-value">{studentCount.toLocaleString()}</div>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-title">Total Faculty</div>
            <div className="dashboard-stat-value">{facultyList.length}</div>
          </div>
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-title">Total Programs</div>
            <div className="dashboard-stat-value">{programsList.length}</div>
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
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Add New Student</h2>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter first name"
                    value={studentForm.firstName}
                    onChange={(e) => handleStudentFormChange('firstName', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter last name"
                    value={studentForm.lastName}
                    onChange={(e) => handleStudentFormChange('lastName', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter email address"
                    value={studentForm.email}
                    onChange={(e) => handleStudentFormChange('email', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={studentForm.dateOfBirth}
                    onChange={(e) => handleStudentFormChange('dateOfBirth', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Year Level</label>
                  <select
                    className="form-input"
                    value={studentForm.year_level}
                    onChange={(e) => handleStudentFormChange('year_level', e.target.value)}
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Program</label>
                  <select
                    className="form-input"
                    value={studentForm.programId}
                    onChange={(e) => handleStudentFormChange('programId', e.target.value)}
                    disabled={!programsLoaded}
                  >
                    <option value="">Select Program</option>
                    {programsList.map((program) => (
                      <option key={program.programID} value={program.programID}>
                        {program.programName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

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
            <div className="modal-header">
              <h2 className="modal-title">Add New Faculty</h2>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid">
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
                  <label className="form-label">Department *</label>
                  <select
                    className="form-input" 
                    value={facultyForm.department}
                    onChange={(e) => handleFacultyFormChange('department', e.target.value)}
                  >
                    <option value="">Select department</option>
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
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
                  <label className="form-label">Employment Status</label>
                  <select
                    className="form-input" 
                    value={facultyForm.employmentStatus}
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