import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminData } from '../hooks/useAdminData';
import { loginUser } from '../services/api';

const formStyle = {
    padding: '40px',
    maxWidth: '400px',
    margin: '50px auto',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    width: '90%',
};

const AdminLoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setAdminInfo } = useAdminData();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const loginData = {
                username,
                password,
                role: 'ADMIN'
            };

            const response = await loginUser(loginData);
            setLoading(false);

            if (response.success) {
                console.log('Admin Login Successful:', response);
                
                // Store admin data in the hook
                setAdminInfo({
                    userId: response.userId,
                    firstName: response.firstName,
                    lastName: response.lastName,
                    username: response.username,
                    role: response.role
                });

                // Navigate to admin dashboard
                navigate('/admin-dashboard');
            } else {
                setError(response.message || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            setLoading(false);
            setError('An error occurred during login. Please try again.');
            console.error('Login request failed:', err);
        }
    };

    return (
        <div style={formStyle}>
            <h2>Admin Login Portal</h2>
            <p>Enter your administrator credentials below.</p>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="admin-username" style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
                    <input
                        type="text"
                        id="admin-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="admin-password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
                    <input
                        type="password"
                        id="admin-password"
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

export default AdminLoginForm;
