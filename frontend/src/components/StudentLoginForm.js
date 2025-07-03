import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginForm.css';
import { authAPI } from '../services/api';

const StudentLoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalStep, setModalStep] = useState(1); // 1: Student ID & Email, 2: Verification Code, 3: New Password
    const [studentId, setStudentId] = useState('');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [modalError, setModalError] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

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

    const handleForgotPassword = () => {
        setShowModal(true);
        setModalStep(1);
        setModalError('');
        setStudentId('');
        setEmail('');
        setVerificationCode('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleModalSubmit = (event) => {
        event.preventDefault();
        setModalError('');
        setModalLoading(true);

        if (modalStep === 1) {
            // Simple alert for sending verification code
            setTimeout(() => {
                setModalLoading(false);
                alert('Verification code sent successfully to your email!');
                setModalStep(2);
            }, 1000);
        } else if (modalStep === 2) {
            // Simple alert for verifying code
            setTimeout(() => {
                setModalLoading(false);
                alert('Code verified successfully!');
                setModalStep(3);
            }, 1000);
        } else if (modalStep === 3) {
            // Reset password
            if (newPassword !== confirmPassword) {
                setModalError('Passwords do not match.');
                setModalLoading(false);
                return;
            }
            
            setTimeout(() => {
                setModalLoading(false);
                alert('Password reset successful! Please login with your new password.');
                setShowModal(false);
            }, 1000);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setModalStep(1);
        setModalError('');
        setStudentId('');
        setEmail('');
        setVerificationCode('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const renderModalContent = () => {
        switch (modalStep) {
            case 1:
                return (
                    <>
                        <h2 className="modal-title">Reset Password</h2>
                        <p className="modal-subtitle">Enter your Student ID and email to receive a verification code.</p>
                        <div className="form-group">
                            <label htmlFor="student-id">Student ID:</label>
                            <input
                                type="text"
                                id="student-id"
                                placeholder="e.g., 2024-10001-S"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email:</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <h2 className="modal-title">Verify Email</h2>
                        <p className="modal-subtitle">Enter the verification code sent to your email.</p>
                        <div className="form-group">
                            <label htmlFor="verification-code">Verification Code:</label>
                            <input
                                type="text"
                                id="verification-code"
                                placeholder="Enter verification code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        <h2 className="modal-title">Set New Password</h2>
                        <p className="modal-subtitle">Enter your new password.</p>
                        <div className="form-group">
                            <label htmlFor="new-password">New Password:</label>
                            <input
                                type="password"
                                id="new-password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirm-password">Confirm Password:</label>
                            <input
                                type="password"
                                id="confirm-password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="form-input"
                            />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="login-container">
            <div className='header'>Student Login Portal</div>
            <p className='subtitle'>Enter your student credentials below.</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="student-username">Username:</label>
                    <input
                        type="text"
                        id="student-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="e.g., 2024-10001-S"
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="student-password">Password:</label>
                    <input
                        type="password"
                        id="student-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                        className="form-input"
                    />
                </div>
                <button 
                    type="button" 
                    className="forgot-password"
                    onClick={handleForgotPassword}
                >
                    Forgot password?
                </button>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" disabled={loading} className="sign-in-btn">
                    {loading ? 'Logging in...' : 'LOGIN'}
                </button>
            </form>
            <p className="help-text">
                <Link to="/">Back to role selection</Link>
            </p>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>&times;</button>
                        <form onSubmit={handleModalSubmit}>
                            {renderModalContent()}
                            {modalError && <p className="error-message">{modalError}</p>}
                            <div className="modal-buttons">
                                <button 
                                    type="button" 
                                    className="modal-btn secondary"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="modal-btn primary"
                                    disabled={modalLoading}
                                >
                                    {modalLoading ? 'Processing...' : 
                                     modalStep === 1 ? 'Send Code' :
                                     modalStep === 2 ? 'Verify' :
                                     'Reset Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentLoginForm;