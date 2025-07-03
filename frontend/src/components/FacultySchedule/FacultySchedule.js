import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './FacultySchedule.module.css';
import Sidebar from '../FacultySidebar';
import { useFacultyData } from '../../hooks/useFacultyData';
import { courseSectionAPI, testConnection } from '../../services/api';

const FacultySchedule = () => {
  const { getUserInfo, facultyData } = useFacultyData();
  const navigate = useNavigate();
  const [scheduleList, setScheduleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState('All Days');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Day options
  const dayOptions = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  // Handle connection errors
  const handleConnectionError = (err) => {
    if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
      setError('Cannot connect to server. Please check if the backend is running on http://localhost:8080');
    } else if (err.code === 'ECONNREFUSED') {
      setError('Connection refused. The backend server is not running.');
    } else if (err.response?.status === 404) {
      setError('API endpoint not found. Please check if the server is properly configured.');
    } else if (err.response?.status === 500) {
      setError('Server error. Please check the backend console for error details.');
    } else if (err.response?.status === 401) {
      setError('Authentication error. Please log in again.');
    } else {
      setError(`Failed to load schedule data: ${err.message}`);
    }
  };

  // Fetch faculty schedule data
  const fetchScheduleData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get faculty data directly from the hook
      const facultyId = facultyData?.facultyID || facultyData?.facultyId;
      if (!facultyData || !facultyId) {
        console.warn('Faculty information not available, cannot fetch schedule.');
        console.log('Available facultyData:', facultyData);
        setScheduleList([]);
        setLoading(false);
        return; 
      }

      console.log('Fetching schedule for faculty ID:', facultyId);
      console.log('Faculty data:', facultyData);

      // First, let's try to get all sections to debug
      try {
        const allSectionsResponse = await courseSectionAPI.getAllSections();
        console.log('All sections in database:', allSectionsResponse.data);
        
        // Filter sections that have faculty assigned
        const sectionsWithFaculty = allSectionsResponse.data.filter(section => section.faculty);
        console.log('Sections with faculty assigned:', sectionsWithFaculty);
        
        // Check if any section has our faculty
        const ourSections = sectionsWithFaculty.filter(section => 
          section.faculty && section.faculty.facultyID === facultyId
        );
        console.log('Sections assigned to our faculty:', ourSections);
      } catch (debugErr) {
        console.error('Debug query failed:', debugErr);
      }

      // Fetch sections assigned to this faculty
      const response = await courseSectionAPI.getSectionsByFaculty(facultyId);
      
      console.log('API Response for faculty sections:', response);
      
      if (response && response.data) {
        // Handle both direct array response and wrapped response
        const sectionsData = Array.isArray(response.data) ? response.data : 
                           (response.data.data || response.data.sections || []);
        
        console.log('Sections data for faculty:', sectionsData);
        
        // Transform the API data to match our component's expected format
        const transformedSchedule = sectionsData.map(section => ({
          id: section.sectionID || section.id,
          courseCode: section.course?.courseCode || 'N/A',
          courseName: section.course?.courseDescription || section.courseName || 'Unknown Course',
          section: section.sectionName || `${section.course?.courseCode || 'UNKNOWN'}-${section.sectionName || 'A'}`,
          instructor: section.faculty ? `${section.faculty.firstName} ${section.faculty.lastName}` : `${facultyData.firstName} ${facultyData.lastName}` || 'Unknown Instructor',
          room: section.schedule?.room || 'TBA',
          day: section.schedule?.day || 'TBA',
          timeFrom: section.schedule?.startTime || '00:00',
          timeTo: section.schedule?.endTime || '00:00',
          status: section.schedule?.status || 'ACTIVE',
          semester: section.semester || 'Current',
          year: section.year || new Date().getFullYear(),
          program: section.course?.program || 'N/A'
        }));
        
        console.log('Transformed schedule:', transformedSchedule);
        setScheduleList(transformedSchedule);
      } else {
        console.log('No data received from API');
        setScheduleList([]);
      }
    } catch (err) {
      console.error('Error fetching schedule data:', err);
      handleConnectionError(err);
      setScheduleList([]);
    } finally {
      setLoading(false);
    }
  }, [facultyData]);

  // Initial data load
  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  // Refresh schedule data
  const refreshScheduleData = async () => {
    setRefreshing(true);
    await fetchScheduleData();
    setRefreshing(false);
  };


  // Statistics calculations
  const totalSchedules = scheduleList.length;
  const todaySchedules = scheduleList.filter(s => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return s.day === today;
  }).length;
  const uniqueCourses = [...new Set(scheduleList.map(s => s.courseName))].length;

  // Filter schedules based on search, day, and status
  const filteredSchedules = scheduleList.filter(schedule => {
    const matchesSearch = schedule.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.program.toLowerCase().includes(searchTerm.toLowerCase());
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

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar userInfo={getUserInfo()}/>
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
      <Sidebar userInfo={getUserInfo()}/>
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
              <div className="stat-label">Program</div>
              <div className="stat-value">{facultyData?.program || 'N/A'}</div>
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
                  <button 
                    onClick={refreshScheduleData}
                    disabled={refreshing}
                    className="refresh-button"
                    title="Refresh Schedule"
                  >
                    {refreshing ? '🔄' : '↻'}
                  </button>
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
                    <th>Program</th>
                    <th>Room</th>
                    <th>Day & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.length > 0 ? (
                    filteredSchedules.map((schedule) => (
                      <tr key={schedule.id}>
                        <td className="course-code">{schedule.courseCode}</td>
                        <td className="course-name">{schedule.courseName}</td>
                        <td className="section-name">{schedule.section}</td>
                        <td className="program-name">{schedule.program}</td>
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
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">
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