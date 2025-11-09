import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [pendingRegistrationId, setPendingRegistrationId] = useState(null);
  const [resendingOtp, setResendingOtp] = useState(false);
  const { verifyOtpAndRegister } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/register', { username, email, password });
      setPendingRegistrationId(response.data.pending_registration_id);
      setShowOtpStep(true);
      setSuccess('OTP sent to your email. Please check your inbox.');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const user = await verifyOtpAndRegister(pendingRegistrationId, otp);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/resend-otp', {
        pending_registration_id: pendingRegistrationId
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
          <h2>Verify Email</h2>
          {error && <div className="error">{error}</div>}
          {success && <div className="success" style={{ color: 'green', marginBottom: '15px' }}>{success}</div>}
          <p style={{ marginBottom: '20px', color: '#666' }}>
            We've sent a 6-digit OTP to <strong>{email}</strong>. Please enter it below to complete your registration.
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
        <h2>Register</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleRegister}>
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
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            Register
          </button>
        </form>
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;

