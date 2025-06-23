import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

// Basic styling (add more in a CSS file if needed)
const formStyle = {
    padding: '40px',
    maxWidth: '400px',
    margin: '50px auto',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    width: '90%', // Ensure it fits on smaller screens
};

const StudentLoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login({ username, password, role: 'student' });
            const data = response.data;
            setLoading(false);

            if (data.success) {
                console.log('Student Login Successful:', data);
                
                // Store user data in localStorage for use across the application
                localStorage.setItem('userData', JSON.stringify({
                    userId: data.userId,
                    username: data.username,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: data.role,
                    studentId: data.studentId,
                    program: data.program,
                    yearLevel: data.yearLevel,
                    status: data.status
                }));
                
                // Store authentication token if provided
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                }
                
                // Show success message and redirect
                navigate('/student-dashboard');
            } else {
                // Handle specific error cases
                if (data.message === "Account is inactive") {
                    setError('Your account is currently inactive. Please contact the administrator.');
                } else if (data.message === "Invalid role for this account") {
                    setError('This account does not have student access.');
                } else {
                    setError(data.message || 'Login failed. Please check your credentials.');
                }
            }
        } catch (err) {
            setLoading(false);
            // Handle axios error response
            if (err.response && err.response.data) {
                const errorData = err.response.data;
                if (errorData.message === "Account is inactive") {
                    setError('Your account is currently inactive. Please contact the administrator.');
                } else if (errorData.message === "Invalid role for this account") {
                    setError('This account does not have student access.');
                } else {
                    setError(errorData.message || 'Login failed. Please check your credentials.');
                }
            } else {
                setError('An error occurred during login. Please try again.');
            }
            console.error('Login request failed:', err);
        }
    };

    return (
        <div style={formStyle}>
            <h2>Student Login Portal</h2>
            <p>Enter your student credentials below.</p>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="student-username" style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
                    <input
                        type="text"
                        id="student-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="e.g., 2024-10001-S"
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="student-password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
                    <input
                        type="password"
                        id="student-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
                <button type="submit" disabled={loading} style={{ 
                    padding: '10px 15px', 
                    cursor: loading ? 'not-allowed' : 'pointer', 
                    width: '100%',
                    backgroundColor: loading ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                }}>
                   {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link to="/">Back to role selection</Link>
            </p>
        </div>
    );
};

export default StudentLoginForm;
