import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ScheduleManagement.css';
import Sidebar from './StudentSidebar';

const StudentSchedule = () => {
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

  const [selectedDay, setSelectedDay] = useState('All Days');
  const [searchTerm, setSearchTerm] = useState('');

  // Day options
  const dayOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // Statistics calculations
  const totalSchedules = scheduleList.length;
  const activeSchedules = scheduleList.filter(s => s.status === 'Active').length;
  const completedSchedules = scheduleList.filter(s => s.status === 'Completed').length;
  const cancelledSchedules = scheduleList.filter(s => s.status === 'Cancelled').length;

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
            <span className="breadcrumb-current">My Schedule</span>
          </div>
          
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">My Schedule</h1>
          </div>

          {/* Stats Cards */}
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

          {/* Schedule List */}
          <div className="schedule-list-container">
            <div className="list-header">
              <div className="list-controls">
                <h2 className="list-title">My Classes</h2>
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
                    placeholder="Search schedules..."
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
                    <th>Status</th>
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