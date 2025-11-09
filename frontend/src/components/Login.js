import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [pendingLoginId, setPendingLoginId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [resendingOtp, setResendingOtp] = useState(false);
  const { login, verifyOtpAndLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await login(username, password);
      
      // Regular user login - should only return pending_login_id
      // Backend now blocks admin from using regular login endpoint
      if (response && response.pending_login_id) {
        // Regular user - OTP required
        setPendingLoginId(response.pending_login_id);
        setUserEmail(response.email);
        setShowOtpStep(true);
        setSuccess('OTP sent to your email. Please check your inbox.');
      } else {
        setError('Unexpected response from server');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const user = await verifyOtpAndLogin(pendingLoginId, otp);
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        // Check if profile needs to be completed
        if (!user.profile_completed && user.role === 'user') {
          navigate('/profile');
        } else {
          navigate('/dashboard');
        }
      }, 200);
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/resend-login-otp', {
        pending_login_id: pendingLoginId
      });
      setSuccess('OTP resent to your email. Please check your inbox.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setResendingOtp(false);
    }
  };

  if (showOtpStep) {
    return (
      <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
        <div className="card">
          <h2>Verify Login</h2>
          {error && <div className="error">{error}</div>}
          {success && <div className="success" style={{ color: 'green', marginBottom: '15px' }}>{success}</div>}
          <p style={{ marginBottom: '20px', color: '#666' }}>
            We've sent a 6-digit OTP to <strong>{userEmail}</strong>. Please enter it below to complete your login.
          </p>
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                required
                style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '5px' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '10px' }}>
              Verify OTP
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              className="btn"
              style={{ width: '100%', backgroundColor: '#f0f0f0', color: '#333' }}
              disabled={resendingOtp}
            >
              {resendingOtp ? 'Resending...' : 'Resend OTP'}
            </button>
          </form>
          <p style={{ marginTop: '15px', textAlign: 'center' }}>
            <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
      <div className="card">
        <h2>Login</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Login
          </button>
        </form>
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
        <p style={{ marginTop: '10px', textAlign: 'center', fontSize: '14px' }}>
          Are you an admin? <Link to="/admin/login">Admin Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

