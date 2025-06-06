import React from 'react';
// Import routing components and new login forms
import { Routes, Route } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import StudentLoginForm from './components/StudentLoginForm';
import FacultyLoginForm from './components/FacultyLoginForm';
import AdminDashboard from './components/AdminDashboard';
import CurriculumManagement from './components/CurriculumManagement';
import StudentManagement from './components/StudentManagement';
import './index.css'; // Global styles

function App() {
  return (
    <div className="App">
      {/* Use Routes component to define possible routes */}
      <Routes>
        {/* Route for the initial role selection page */}
        <Route path="/" element={<LoginPage />} />

        {/* Route for the Student login form */}
        <Route path="/login/student" element={<StudentLoginForm />} />

        {/* Route for the Faculty login form */}
        <Route path="/login/faculty" element={<FacultyLoginForm />} />

        {/* Route for the admin dashboard form */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        <Route path="/curriculum-management" element={<CurriculumManagement />} />

        <Route path="/student-management" element={<StudentManagement />} />

        {/* Add other routes for dashboards etc. later */}
        {/* Example: <Route path="/dashboard" element={<Dashboard />} /> */}

        {/* Optional: Add a catch-all route for 404 Not Found */}
        <Route path="*" element={<div><h2>404 Not Found</h2><p>The page you requested does not exist.</p><a href='/'>Go Home</a></div>} />
      </Routes>
    </div>
  );
}

export default App;