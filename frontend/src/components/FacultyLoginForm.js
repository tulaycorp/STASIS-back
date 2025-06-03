import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Basic styling (can share CSS later)
const formStyle = {
    padding: '40px',
    maxWidth: '400px',
    margin: '50px auto',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    width: '90%', // Ensure it fits on smaller screens
};

const FacultyLoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

     const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        // Temporary hardcoded login check
        if (username === 'faculty123' && password === 'pass123') {
            setLoading(false);
            window.location.href = '/admin-dashboard';
            return;
        }

        try {
            const response = await fetch('/api/auth/login', { // Calls the same backend endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role: 'faculty' }), // Role is 'faculty'
            });

            const data = await response.json();
            setLoading(false);

             if (response.ok && data.success) {
                console.log('Faculty Login Successful:', data);
                alert(`Welcome ${data.userDisplayName}! Login successful. Redirecting...`);
                 // TODO: Redirect to faculty dashboard
            } else {
                setError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
             setLoading(false);
             setError('An error occurred during login. Please try again.');
             console.error('Login request failed:', err);
        }
    };

    return (
         <div style={formStyle}>
            <h2>Faculty Login Portal</h2> {/* Changed Title */}
            <p>Enter your faculty credentials below.</p> {/* Changed Text */}
            <form onSubmit={handleSubmit}>
                 <div style={{ marginBottom: '15px' }}>
                     <label htmlFor="faculty-username" style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
                     <input
                        type="text"
                        id="faculty-username" // Changed ID
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                 <div style={{ marginBottom: '15px' }}>
                     <label htmlFor="faculty-password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
                     <input
                        type="password"
                        id="faculty-password" // Changed ID
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                 {error && <p style={{ color: 'red' }}>{error}</p>}
                 <button type="submit" disabled={loading} style={{ padding: '10px 15px', cursor: 'pointer', width: '100%' }}>
                     {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link to="/">Back to role selection</Link>
            </p>
        </div>
    );
};

export default FacultyLoginForm;