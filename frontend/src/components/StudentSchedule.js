import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentSchedule.module.css';
import Sidebar from './StudentSidebar';
import { useStudentData } from '../hooks/useStudentData';
import { enrolledCourseAPI } from '../services/api';

const StudentSchedule = () => {
  const { studentData, loading: studentLoading, error: studentError } = useStudentData();
  const studentId = studentData?.id;

  const [scheduleList, setScheduleList] = useState([]);
  const [selectedDay, setSelectedDay] = useState('All Days');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Day options
  const dayOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // Fetch schedule from backend
  useEffect(() => {
    if (!studentId || studentLoading) return;
    
    console.log('Fetching schedule for student ID:', studentId);
    setLoading(true);
    
    enrolledCourseAPI.getEnrolledCoursesByStudent(studentId)
      .then(res => {
        console.log('Raw enrolled courses response:', res);
        console.log('Enrolled courses data:', res.data);
        console.log('Number of enrolled courses:', res.data?.length || 0);
        
        // Filter only active enrollments and map to schedule format
        const mapped = (res.data || [])
          .filter(ec => {
            console.log('Checking enrollment status:', ec.status);
            return ec.status === 'Enrolled' || ec.status === 'ENROLLED';
          })
          .map((ec) => {
            console.log('Processing enrollment for schedule:', ec);
            console.log('Section data:', ec.section);
            console.log('Course data:', ec.section?.course);
            console.log('Faculty data:', ec.section?.faculty);
            
            return {
              courseCode: ec.section?.course?.courseCode || 'N/A',
              course: ec.section?.course?.courseDescription || ec.section?.course?.courseName || ec.section?.course?.courseCode || '',
              section: ec.section?.sectionName || '',
              instructor: ec.section?.faculty
                ? `${ec.section.faculty.firstName} ${ec.section.faculty.lastName}`
                : 'TBA',
              room: ec.section?.room || 'TBA',
              day: ec.section?.day || '',
              timeFrom: ec.section?.startTime ? ec.section.startTime.substring(0, 5) : '',
              timeTo: ec.section?.endTime ? ec.section.endTime.substring(0, 5) : '',
              status: ec.status
            };
          });
        console.log('Final mapped schedule data:', mapped);
        setScheduleList(mapped);
      })
      .catch((error) => {
        console.error('Error fetching enrolled courses:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setScheduleList([]);
      })
      .finally(() => setLoading(false));
  }, [studentId, studentLoading]);

  // Statistics calculations
  const totalSchedules = scheduleList.length;
  const todaySchedules = scheduleList.filter(s => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return s.day === today;
  }).length;
  const weekSchedules = scheduleList.length;
  const uniqueInstructors = [...new Set(scheduleList.map(s => s.instructor))].length;

  // Filter schedules based on search and day
  const filteredSchedules = scheduleList.filter(schedule => {
    const matchesSearch = (schedule.course || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (schedule.section || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (schedule.instructor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (schedule.room || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (schedule.courseCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDay = selectedDay === 'All Days' || schedule.day === selectedDay;
    return matchesSearch && matchesDay;
  });

  // Format time for display
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Navigation
  const navigate = useNavigate();
  const showSection = (section) => {
    switch(section){
      case 'StudentDashboard':
        navigate('/student-dashboard');
        break;
      case 'StudentSchedule':
        navigate('/student-schedule');
        break;
      case 'Enrollment':
        navigate('/enrollment');
        break;
      case 'StudentCurriculum':
        navigate('/student-curriculum');
        break;
      case 'StudentGrades':
        navigate('/student-grades');
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
        userInfo={{ 
          name: studentData ? `${studentData.firstName} ${studentData.lastName}` : "Loading...", 
          role: "Student" 
        }}
        sections={[
          {
            items: [{ id: 'StudentDashboard', label: 'Dashboard', icon: '📊' }]
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
            <span className="breadcrumb-current">Schedule</span>
          </div>
          
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">My Schedule</h1>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Classes</div>
              <div className="stat-value">{totalSchedules}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Today's Classes</div>
              <div className="stat-value">{todaySchedules}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Weekly Classes</div>
              <div className="stat-value">{weekSchedules}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Instructors</div>
              <div className="stat-value">{uniqueInstructors}</div>
            </div>
          </div>

          {/* Schedule List */}
          <div className="schedule-list-container">
            <div className="list-header">
              <div className="list-controls">
                <h2 className="list-title">Class Schedule</h2>
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
                    placeholder="Search classes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Section</th>
                    <th>Instructor</th>
                    <th>Room</th>
                    <th>Day & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6}>Loading schedule...</td>
                    </tr>
                  ) : filteredSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No classes found.</td>
                    </tr>
                  ) : (
                    filteredSchedules.map((schedule, index) => (
                      <tr key={`${schedule.courseCode}-${index}`}>
                        <td>{schedule.courseCode}</td>
                        <td>{schedule.course || 'N/A'}</td>
                        <td>{schedule.section}</td>
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
                      </tr>
                    ))
                  )}
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
    </div>
  );
};

export default StudentSchedule;