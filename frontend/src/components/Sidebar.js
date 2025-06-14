import React from 'react';
import './Sidebar.css'; // You can extract sidebar styles here

// Utility function to get active page from current URL
const getActivePageFromURL = () => {
  const path = window.location.pathname;
  
  if (path === '/admin-dashboard' || path === '/') {
    return 'Dashboard';
  } else if (path === '/student-management') {
    return 'Students';
  } else if (path === '/curriculum-management') {
    return 'Curriculum';
  } else if (path === '/schedule-management') {
    return 'Schedule';
  } else if (path === '/faculty-management') {
    return 'Faculty';
  } else if (path === '/course-management') {
    return 'Courses';
  } else if (path === '/settings') {
    return 'Settings';
  }
  
  // Return empty string if no match so nothing is highlighted
  return '';
};

const Sidebar = ({ onNavigate }) => {
  // Automatically determine active page from URL instead of using prop
  const activePage = getActivePageFromURL();
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">S</div>
      </div>      <div className="sidebar-content">
        <div className="nav-section">
          <div className="nav-label">Main</div>
          <div className="nav-items">
            <div
              className={`nav-item${activePage === 'Dashboard' ? ' active-page' : ''}`}
              onClick={() => onNavigate('Dashboard')}
            >
              📊 Dashboard
            </div>
          </div>
        </div>
        <div className="nav-section">
          <div className="nav-label">Management</div>
          <div className="nav-items">
            <div
              className={`nav-item${activePage === 'Students' ? ' active-page' : ''}`}
              onClick={() => onNavigate('Students')}
            >
              👥 Students
            </div>
            <div
              className={`nav-item${activePage === 'Curriculum' ? ' active-page' : ''}`}
              onClick={() => onNavigate('Curriculum')}
            >
              📚 Curriculum
            </div>
            <div
              className={`nav-item${activePage === 'Schedule' ? ' active-page' : ''}`}
              onClick={() => onNavigate('Schedule')}
            >
              📅 Schedule
            </div>
            <div
              className={`nav-item${activePage === 'Faculty' ? ' active-page' : ''}`}
              onClick={() => onNavigate('Faculty')}
            >
              👨‍🏫 Faculty
            </div>
            <div
              className={`nav-item${activePage === 'Courses' ? ' active-page' : ''}`}
              onClick={() => onNavigate('Courses')}
            >
              📖 Courses
            </div>
          </div>
        </div>
        <div className="nav-section">
          <div className="nav-label">System</div>
          <div className="nav-items">
            <div
              className={`nav-item${activePage === 'Settings' ? ' active-page' : ''}`}
              onClick={() => onNavigate('Settings')}
            >
              ⚙️ Settings
            </div>
            <div className="nav-item">🔧 Admin Tools</div>
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
          <div className="user-avatar">DA</div>
          <div className="user-info">
            <div className="user-name">David Anderson</div>
            <div className="user-role">Schedule Admin</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;