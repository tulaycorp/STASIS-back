import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Enrollment.module.css';
import Sidebar from './StudentSidebar';

const Enrollment = () => {
  // Sample enrollment data
  const [enrollmentList, setEnrollmentList] = useState([
    {
      id: 'ENR001',
      course: 'Computer Programming I',
      section: 'CS-101-A',
      instructor: 'Emily Thompson',
      room: 'Room 204',
      day: 'Monday',
      timeFrom: '08:00',
      timeTo: '10:00',
      credits: 3,
      slots: 25,
      enrolled: 18,
      status: 'Available'
    },
    {
      id: 'ENR002',
      course: 'Database Management',
      section: 'IT-201-B',
      instructor: 'James Chen',
      room: 'Lab 301',
      day: 'Tuesday',
      timeFrom: '10:00',
      timeTo: '12:00',
      credits: 3,
      slots: 20,
      enrolled: 20,
      status: 'Full'
    },
    {
      id: 'ENR003',
      course: 'Business Ethics',
      section: 'BA-105-A',
      instructor: 'Sarah Martinez',
      room: 'Room 105',
      day: 'Wednesday',
      timeFrom: '14:00',
      timeTo: '16:00',
      credits: 2,
      slots: 30,
      enrolled: 12,
      status: 'Available'
    },
    {
      id: 'ENR004',
      course: 'Engineering Mathematics',
      section: 'ENG-102-C',
      instructor: 'Michael Roberts',
      room: 'Room 307',
      day: 'Thursday',
      timeFrom: '09:00',
      timeTo: '11:00',
      credits: 4,
      slots: 25,
      enrolled: 23,
      status: 'Available'
    },
    {
      id: 'ENR005',
      course: 'General Psychology',
      section: 'PSY-101-A',
      instructor: 'Rachel Williams',
      room: 'Room 201',
      day: 'Friday',
      timeFrom: '13:00',
      timeTo: '15:00',
      credits: 3,
      slots: 28,
      enrolled: 15,
      status: 'Available'
    },
    {
      id: 'ENR006',
      course: 'Data Structures',
      section: 'CS-201-B',
      instructor: 'Emily Thompson',
      room: 'Lab 205',
      day: 'Monday',
      timeFrom: '15:00',
      timeTo: '17:00',
      credits: 3,
      slots: 22,
      enrolled: 19,
      status: 'Available'
    },
    {
      id: 'ENR007',
      course: 'Network Administration',
      section: 'IT-301-A',
      instructor: 'James Chen',
      room: 'Lab 302',
      day: 'Wednesday',
      timeFrom: '08:00',
      timeTo: '10:00',
      credits: 4,
      slots: 18,
      enrolled: 16,
      status: 'Available'
    },
    {
      id: 'ENR008',
      course: 'Financial Accounting',
      section: 'BA-201-C',
      instructor: 'Sarah Martinez',
      room: 'Room 106',
      day: 'Friday',
      timeFrom: '10:00',
      timeTo: '12:00',
      credits: 3,
      slots: 25,
      enrolled: 21,
      status: 'Available'
    }
  ]);

  const [myEnrollments, setMyEnrollments] = useState([
    {
      id: 'ENR001',
      course: 'Computer Programming I',
      section: 'CS-101-A',
      instructor: 'Emily Thompson',
      credits: 3,
      status: 'Enrolled',
      enrollmentDate: '2025-01-15'
    },
    {
      id: 'ENR003',
      course: 'Business Ethics',
      section: 'BA-105-A',
      instructor: 'Sarah Martinez',
      credits: 2,
      status: 'Enrolled',
      enrollmentDate: '2025-01-16'
    }
  ]);

  const [selectedTab, setSelectedTab] = useState('available');
  const [selectedDay, setSelectedDay] = useState('All Days');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Day options
  const dayOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // Statistics calculations
  const totalCourses = enrollmentList.length;
  const availableCourses = enrollmentList.filter(c => c.status === 'Available').length;
  const fullCourses = enrollmentList.filter(c => c.status === 'Full').length;
  const myTotalCredits = myEnrollments.reduce((sum, enrollment) => sum + enrollment.credits, 0);

  // Filter courses based on search and day
  const filteredCourses = enrollmentList.filter(course => {
    const matchesSearch = course.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDay = selectedDay === 'All Days' || course.day === selectedDay;
    return matchesSearch && matchesDay;
  });

  // Format time for display
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Handle enrollment
  const handleEnroll = (course) => {
    setSelectedCourse(course);
    setShowEnrollModal(true);
  };

  const confirmEnrollment = () => {
    if (selectedCourse) {
      // Check if already enrolled
      const alreadyEnrolled = myEnrollments.some(e => e.id === selectedCourse.id);
      if (alreadyEnrolled) {
        alert('You are already enrolled in this course!');
        setShowEnrollModal(false);
        return;
      }

      // Add to my enrollments
      const newEnrollment = {
        id: selectedCourse.id,
        course: selectedCourse.course,
        section: selectedCourse.section,
        instructor: selectedCourse.instructor,
        credits: selectedCourse.credits,
        status: 'Enrolled',
        enrollmentDate: new Date().toISOString().split('T')[0]
      };

      setMyEnrollments([...myEnrollments, newEnrollment]);

      // Update enrollment count
      setEnrollmentList(prev => prev.map(course => 
        course.id === selectedCourse.id 
          ? { ...course, enrolled: course.enrolled + 1, status: course.enrolled + 1 >= course.slots ? 'Full' : 'Available' }
          : course
      ));

      setShowEnrollModal(false);
      setSelectedCourse(null);
      alert('Successfully enrolled in the course!');
    }
  };

  // Handle drop
  const handleDrop = (enrollmentId) => {
    if (window.confirm('Are you sure you want to drop this course?')) {
      setMyEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      
      // Update enrollment count
      setEnrollmentList(prev => prev.map(course => 
        course.id === enrollmentId 
          ? { ...course, enrolled: course.enrolled - 1, status: 'Available' }
          : course
      ));

      alert('Course dropped successfully!');
    }
  };

  // Navigation
  const navigate = useNavigate();
  const showSection = (section) => {
    switch(section){
      case 'Dashboard':
        navigate('/student-dashboard');
        break;
      case 'StudentSchedule':
        navigate('/student-schedule');
        break;
      case 'Enrollment':
        navigate('/enrollment');
        break;
      case 'StudentCurriculum':
        alert("Curriculum page here");
        break;
      case 'StudentGrades':
        alert("Grades page here");
        break;
      case 'StudentSettings':
        navigate('/student-settings');
        break;
      default:
        // No action for unknown sections
    }
  };

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
        <div className="content-wrapper">
          <div className="breadcrumb">
            <span 
              className="breadcrumb-link" 
              onClick={() => navigate('/student-dashboard')}
            >
              Dashboard
            </span>
            <span className="breadcrumb-separator"> / </span>
            <span className="breadcrumb-current">Enrollment</span>
          </div>
          
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">Course Enrollment</h1>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Courses</div>
              <div className="stat-value">{totalCourses}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Available</div>
              <div className="stat-value">{availableCourses}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Full</div>
              <div className="stat-value">{fullCourses}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">My Credits</div>
              <div className="stat-value">{myTotalCredits}</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${selectedTab === 'available' ? 'active' : ''}`}
              onClick={() => setSelectedTab('available')}
            >
              Available Courses
            </button>
            <button 
              className={`tab-btn ${selectedTab === 'enrolled' ? 'active' : ''}`}
              onClick={() => setSelectedTab('enrolled')}
            >
              My Enrollments ({myEnrollments.length})
            </button>
          </div>

          {/* Course List */}
          <div className="schedule-list-container">
            <div className="list-header">
              <div className="list-controls">
                <h2 className="list-title">
                  {selectedTab === 'available' ? 'Available Courses' : 'My Enrollments'}
                </h2>
                {selectedTab === 'available' && (
                  <div className="controls">
                    <select 
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="select-input"
                    >
                      <option>All Days</option>
                      {dayOptions.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="table-container">
              {selectedTab === 'available' ? (
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>Course ID</th>
                      <th>Course & Section</th>
                      <th>Instructor</th>
                      <th>Schedule</th>
                      <th>Credits</th>
                      <th>Capacity</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((course) => (
                      <tr key={course.id}>
                        <td>{course.id}</td>
                        <td>
                          <div className="schedule-info">
                            <div className="schedule-course">{course.course}</div>
                            <div className="schedule-section">{course.section}</div>
                          </div>
                        </td>
                        <td>{course.instructor}</td>
                        <td>
                          <div className="time-info">
                            <div className="time-period">
                              {formatTime(course.timeFrom)} - {formatTime(course.timeTo)}
                            </div>
                            <div className="day-info">{course.day} • {course.room}</div>
                          </div>
                        </td>
                        <td className="font-semibold">{course.credits}</td>
                        <td>
                          <div className="capacity-info">
                            <span className="enrolled-count">{course.enrolled}/{course.slots}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${
                            course.status === 'Available' ? 'status-active' : 'status-cancelled'
                          }`}>
                            {course.status}
                          </span>
                        </td>
                        <td>
                          <button 
                            className={`btn-enroll ${course.status === 'Full' ? 'disabled' : ''}`}
                            onClick={() => handleEnroll(course)}
                            disabled={course.status === 'Full' || myEnrollments.some(e => e.id === course.id)}
                          >
                            {myEnrollments.some(e => e.id === course.id) ? 'Enrolled' : 
                             course.status === 'Full' ? 'Full' : 'Enroll'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>Course ID</th>
                      <th>Course & Section</th>
                      <th>Instructor</th>
                      <th>Credits</th>
                      <th>Status</th>
                      <th>Enrollment Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myEnrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td>{enrollment.id}</td>
                        <td>
                          <div className="schedule-info">
                            <div className="schedule-course">{enrollment.course}</div>
                            <div className="schedule-section">{enrollment.section}</div>
                          </div>
                        </td>
                        <td>{enrollment.instructor}</td>
                        <td className="font-semibold">{enrollment.credits}</td>
                        <td>
                          <span className="status-badge status-active">
                            {enrollment.status}
                          </span>
                        </td>
                        <td>{enrollment.enrollmentDate}</td>
                        <td>
                          <button 
                            className="btn-drop"
                            onClick={() => handleDrop(enrollment.id)}
                          >
                            Drop
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="table-footer">
              <div className="table-info">
                {selectedTab === 'available' 
                  ? `Showing 1 to ${filteredCourses.length} of ${totalCourses} courses`
                  : `Showing 1 to ${myEnrollments.length} of ${myEnrollments.length} enrollments`
                }
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

      {/* Enrollment Confirmation Modal */}
      {showEnrollModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Confirm Enrollment</h3>
            </div>
            <div className="modal-content">
              {selectedCourse && (
                <div className="enrollment-details">
                  <p><strong>Course:</strong> {selectedCourse.course}</p>
                  <p><strong>Section:</strong> {selectedCourse.section}</p>
                  <p><strong>Instructor:</strong> {selectedCourse.instructor}</p>
                  <p><strong>Schedule:</strong> {selectedCourse.day}, {formatTime(selectedCourse.timeFrom)} - {formatTime(selectedCourse.timeTo)}</p>
                  <p><strong>Credits:</strong> {selectedCourse.credits}</p>
                  <p><strong>Room:</strong> {selectedCourse.room}</p>
                  <br />
                  <p>Are you sure you want to enroll in this course?</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowEnrollModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={confirmEnrollment}
              >
                Confirm Enrollment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enrollment;