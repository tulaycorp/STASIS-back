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

const FacultySidebar = ({ onNavigate, userInfo, sections }) => {
  // Automatically determine active page from URL instead of using prop
  const activePage = getActivePageFromURL();
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userInfo?.name) return 'FA';
    const names = userInfo.name.split(' ');
    return names.map(name => name.charAt(0)).join('').toUpperCase();
  };
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">S</div>
      </div>
      <div className="sidebar-content">
        {sections ? (
          sections.map((section, index) => (
            <div key={index} className="nav-section">
              {section.label && <div className="nav-label">{section.label}</div>}
              <div className="nav-items">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className={`nav-item${activePage === item.id ? ' active-page' : ''}`}
                    onClick={() => onNavigate(item.id)}
                  >
                    {item.icon} {item.label}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <>
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
          </>
        )}
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
          <div className="user-avatar">{getUserInitials()}</div>
          <div className="user-info">
            <div className="user-name">{userInfo?.name || 'Faculty User'}</div>
            <div className="user-role">{userInfo?.role || 'Faculty'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultySidebar;