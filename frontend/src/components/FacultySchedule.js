import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FacultySchedule.module.css';
import Sidebar from './FacultySidebar';
import { useFacultyData } from '../hooks/useFacultyData';
import { courseSectionAPI } from '../services/api';

const FacultySchedule = () => {
  const { getUserInfo } = useFacultyData();
  const [scheduleList, setScheduleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState('All Days');
  const [searchTerm, setSearchTerm] = useState('');

  // Day options
  const dayOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // Fetch faculty schedule data
  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userInfo = getUserInfo();
        if (!userInfo || !userInfo.id) {
          // Gracefully handle missing user info instead of throwing an error.
          // The component will just show an empty schedule.
          console.warn('Faculty information not available, cannot fetch schedule.');
          return; 
        }

        // Fetch sections assigned to this faculty
        const response = await courseSectionAPI.getSectionsByFaculty(userInfo.id);
        
        if (response.data && response.data.success) {
          // Transform the API data to match our component's expected format
          const transformedSchedule = response.data.data.map(section => ({
            id: section.id,
            course: section.courseName || section.course?.name || 'Unknown Course',
            section: section.sectionName || `${section.course?.code || 'UNKNOWN'}-${section.sectionName || 'A'}`,
            instructor: section.faculty?.name || userInfo.name || 'Unknown Instructor',
            room: section.room || 'TBA',
            day: section.day || 'TBA',
            timeFrom: section.timeFrom || '00:00',
            timeTo: section.timeTo || '00:00',
            status: section.status || 'Active'
          }));
          
          setScheduleList(transformedSchedule);
        } else {
          setScheduleList([]);
        }
      } catch (err) {
        console.error('Error fetching schedule data:', err);
        setError(err.message || 'Failed to load schedule data');
        setScheduleList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, [getUserInfo]);

  // Statistics calculations
  const totalSchedules = scheduleList.length;
  const todaySchedules = scheduleList.filter(s => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return s.day === today;
  }).length;
  const weekSchedules = scheduleList.length; // All are weekly schedules
  const uniqueCourses = [...new Set(scheduleList.map(s => s.course))].length;

  // Filter schedules based on search and day
  const filteredSchedules = scheduleList.filter(schedule => {
    const matchesSearch = schedule.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.id.toString().toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDay = selectedDay === 'All Days' || schedule.day === selectedDay;
    return matchesSearch && matchesDay;
  });

  // Format time for display
  const formatTime = (time) => {
    if (!time || time === '00:00') return 'TBA';
    const [hours, minutes] = time.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Navigation
  const navigate = useNavigate();
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

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-container">
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
        <div className="main-content">
          <div className="content-wrapper">
            <div className="loading-container">
              <div className="loading-spinner">Loading schedule...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="content-wrapper">
          <div className="breadcrumb">
            <span 
              className="breadcrumb-link" 
              onClick={() => navigate('/faculty-dashboard')}
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

          {/* Error Message for other potential errors */}
          {error && (
            <div className="error-message">
              <div className="error-text">
                ⚠️ {error}
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="retry-button"
              >
                Retry
              </button>
            </div>
          )}

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
              <div className="stat-label">Unique Courses</div>
              <div className="stat-value">{uniqueCourses}</div>
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
                    <th>Room</th>
                    <th>Day & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.length > 0 ? (
                    filteredSchedules.map((schedule) => (
                      <tr key={schedule.id}>
                        <td>{schedule.id}</td>
                        <td>
                          <div className="schedule-info">
                            <div className="schedule-course">{schedule.course}</div>
                            <div className="schedule-section">{schedule.section}</div>
                          </div>
                        </td>
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
                          <span className={`status-badge ${schedule.status.toLowerCase()}`}>
                            {schedule.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-data">
                        {searchTerm || selectedDay !== 'All Days' 
                          ? 'No schedules match your search criteria' 
                          : 'No schedules assigned yet'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <div className="table-info">
                Showing {filteredSchedules.length > 0 ? '1' : '0'} to {filteredSchedules.length} of {totalSchedules} entries
              </div>
              {filteredSchedules.length > 10 && (
                <div className="pagination">
                  <button className="page-btn disabled">Previous</button>
                  <button className="page-btn active">1</button>
                  <button className="page-btn">2</button>
                  <button className="page-btn">Next</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultySchedule;