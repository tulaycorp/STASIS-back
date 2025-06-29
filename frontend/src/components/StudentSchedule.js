import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentSchedule.module.css';
import Sidebar from './StudentSidebar';
import { useStudentData } from '../hooks/useStudentData';

const StudentSchedule = () => {
  const { getUserInfo } = useStudentData();
  // Sample schedule data - removed status field
  const [scheduleList, setScheduleList] = useState([
    {
      id: 'SCH001',
      course: 'Computer Programming I',
      section: 'CS-101-A',
      instructor: 'Emily Thompson',
      room: 'Room 204',
      day: 'Monday',
      timeFrom: '08:00',
      timeTo: '10:00'
    },
    {
      id: 'SCH002',
      course: 'Database Management',
      section: 'IT-201-B',
      instructor: 'James Chen',
      room: 'Lab 301',
      day: 'Tuesday',
      timeFrom: '10:00',
      timeTo: '12:00'
    },
    {
      id: 'SCH003',
      course: 'Business Ethics',
      section: 'BA-105-A',
      instructor: 'Sarah Martinez',
      room: 'Room 105',
      day: 'Wednesday',
      timeFrom: '14:00',
      timeTo: '16:00'
    },
    {
      id: 'SCH004',
      course: 'Engineering Mathematics',
      section: 'ENG-102-C',
      instructor: 'Michael Roberts',
      room: 'Room 307',
      day: 'Thursday',
      timeFrom: '09:00',
      timeTo: '11:00'
    },
    {
      id: 'SCH005',
      course: 'General Psychology',
      section: 'PSY-101-A',
      instructor: 'Rachel Williams',
      room: 'Room 201',
      day: 'Friday',
      timeFrom: '13:00',
      timeTo: '15:00'
    },
    {
      id: 'SCH006',
      course: 'Data Structures',
      section: 'CS-201-B',
      instructor: 'Emily Thompson',
      room: 'Lab 205',
      day: 'Monday',
      timeFrom: '15:00',
      timeTo: '17:00'
    },
    {
      id: 'SCH007',
      course: 'Network Administration',
      section: 'IT-301-A',
      instructor: 'James Chen',
      room: 'Lab 302',
      day: 'Wednesday',
      timeFrom: '08:00',
      timeTo: '10:00'
    },
    {
      id: 'SCH008',
      course: 'Financial Accounting',
      section: 'BA-201-C',
      instructor: 'Sarah Martinez',
      room: 'Room 106',
      day: 'Friday',
      timeFrom: '10:00',
      timeTo: '12:00'
    }
  ]);

  const [selectedDay, setSelectedDay] = useState('All Days');
  const [searchTerm, setSearchTerm] = useState('');

  // Day options
  const dayOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // Statistics calculations - simplified without status
  const totalSchedules = scheduleList.length;
  const todaySchedules = scheduleList.filter(s => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return s.day === today;
  }).length;
  const weekSchedules = scheduleList.length; // All are weekly schedules
  const uniqueInstructors = [...new Set(scheduleList.map(s => s.instructor))].length;

  // Filter schedules based on search and day
  const filteredSchedules = scheduleList.filter(schedule => {
    const matchesSearch = schedule.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDay = selectedDay === 'All Days' || schedule.day === selectedDay;
    return matchesSearch && matchesDay;
  });

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
        userInfo={getUserInfo()}
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

          {/* Stats Cards - Updated without status-based stats */}
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
                    <th>Schedule ID</th>
                    <th>Course & Section</th>
                    <th>Instructor</th>
                    <th>Room</th>
                    <th>Day & Time</th>
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
    </div>
  );
};

export default StudentSchedule;