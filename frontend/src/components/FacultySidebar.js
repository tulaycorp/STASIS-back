import React from 'react';
import './FacultySidebar.module.css';

// Utility function to get active page from current URL
const getActivePageFromURL = () => {
  const path = window.location.pathname;
  
  if (path === '/faculty-dashboard' || path === '/') {
    return 'FacultyDashboard';
  } else if (path === '/faculty-schedule') {
    return 'FacultySchedule';
  } else if (path === '/faculty-grades') {
    return 'FacultyGrades';
  } else if (path === '/faculty-settings') {
    return 'FacultySettings';
  }
  
  // Return empty string if no match so nothing is highlighted
  return '';
};

const FacultySidebar = ({ onNavigate }) => {
  // Automatically determine active page from URL instead of using prop
  const activePage = getActivePageFromURL();
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">S</div>
      </div>
      <div className="sidebar-content">
        <div className="nav-section">
          <div className="nav-label">Main</div>
          <div className="nav-items">
            <div
              className={`nav-item${activePage === 'FacultyDashboard' ? ' active-page' : ''}`}
              onClick={() => onNavigate('FacultyDashboard')}
            >
              📊 Dashboard
            </div>
          </div>
        </div>
        <div className="nav-section">
          <div className="nav-label">Management</div>
          <div className="nav-items">
            <div
              className={`nav-item${activePage === 'FacultySchedule' ? ' active-page' : ''}`}
              onClick={() => onNavigate('FacultySchedule')}
            >
              📅 Schedule
            </div>
            <div
              className={`nav-item${activePage === 'FacultyGrades' ? ' active-page' : ''}`}
              onClick={() => onNavigate('FacultyGrades')}
            >
              📈 Grades
            </div>
          </div>
        </div>
        <div className="nav-section">
          <div className="nav-label">System</div>
          <div className="nav-items">
            <div
              className={`nav-item${activePage === 'FacultySettings' ? ' active-page' : ''}`}
              onClick={() => onNavigate('FacultySettings')}
            >
              ⚙️ Settings
            </div>
          </div>
        </div>
      </div>
      <div className="sidebar-footer">
        <button className="logout-button" onClick={() => {
          if (window.confirm('Are you sure you want to log out?')) {
            window.location.href = '/';
          }
        }}>
          🚪 Log Out
        </button>
        <div className="user-profile">
          <div className="user-avatar">JD</div>
          <div className="user-info">
            <div className="user-name">John Doe</div>
            <div className="user-role">Faculty</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultySidebar;