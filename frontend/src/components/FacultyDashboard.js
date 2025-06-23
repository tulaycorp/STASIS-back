import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import Sidebar from './FacultySidebar';
import { useFacultyData } from '../hooks/useFacultyData';

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { getFacultyName, getUserInfo } = useFacultyData();
  const [dashboardData, setStudentDashboardData] = useState({
    recentActivities: []
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

  // Schedule data
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

  // Navigation
  const showSection = (section) => {
    switch(section){
      case 'FacultyDashboard':
        navigate('/faculty-dashboard');
        break;
      case 'FacultySchedule':
        navigate('/faculty-schedule');
        break;
        case 'FacultyGrades':
          navigate('/faculty-grades');
        break;
      case 'FacultySettings':
        navigate('/faculty-settings');
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
            items: [{ id: 'FacultyDashboard', label: 'Dashboard', icon: '📊' }]
          },
          {
            label: 'Management',
            items: [
              { id: 'FacultySchedule', label: 'Schedule', icon: '📅' },
              { id: 'FacultyGrades', label: 'Grades', icon: '📈' }
            ]
          },
          {
            label: 'System',
            items: [
              { id: 'FacultySettings', label: 'Settings', icon: '⚙️'}
            ]
          }
        ]}
      />

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <h1 className="dashboard-welcome-title">Welcome back, {getFacultyName()}</h1>
        </div>

        {/* Content Wrapper */}
        <div className="dashboard-content-wrapper">
          {/* Main Left Section */}
          <div className="dashboard-main-section">
            <div className="dashboard-main-grid">
              {/* Quick Actions - Empty Section */}
              <div className="dashboard-section-card">
                <div className="dashboard-section-header">
                  <h2 className="dashboard-section-title">Quick Actions</h2>
                </div>
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6c757d' }}>
                  No quick actions available
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
    </div>
  );
};

export default FacultyDashboard;