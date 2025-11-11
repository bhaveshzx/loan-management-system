import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './auth.css';

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
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [otpError, setOtpError] = useState('');
  const otpInputRef = useRef(null);
  const { login, verifyOtpAndLogin } = useAuth();
  const navigate = useNavigate();

  // Focus OTP input when OTP step is shown
  useEffect(() => {
    if (showOtpStep && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [showOtpStep]);

  const validateForm = () => {
    let isValid = true;
    setUsernameError('');
    setPasswordError('');

    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUsernameError('');
    setPasswordError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await login(username, password);
      
      // Check if OTP is required
      if (response && response.requires_otp === false) {
        // Admin login - direct login without OTP
        // AuthContext already handled token and user state
        // Navigate to dashboard (role-based routing handled in App.js)
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
        return;
      } else if (response && response.pending_login_id) {
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
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setOtpError('');

    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const user = await verifyOtpAndLogin(pendingLoginId, otp);
      
      setSuccess('OTP verified successfully! Redirecting...');
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        // Check if profile needs to be completed
        if (!user.profile_completed && user.role === 'user') {
          navigate('/profile');
        } else {
          // Navigate to dashboard (role-based routing handled in App.js)
          navigate('/dashboard');
        }
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
      setOtpError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    setError('');
    setSuccess('');
    setOtp('');
    if (otpInputRef.current) {
      otpInputRef.current.focus();
    }

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

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setOtpError('');
    if (value.length === 6) {
      // Auto-submit when 6 digits are entered
      setTimeout(() => {
        if (otpInputRef.current) {
          otpInputRef.current.form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }, 100);
    }
  };

  if (showOtpStep) {
    return (
      <div className="auth-page">
        <Link to="/" className="back-to-home">
          ← Back to Home
        </Link>
        <div className="auth-container">
          <div className="auth-card">
            <h2>Verify Login</h2>
            {error && <div className="error-message">⚠️ {error}</div>}
            {success && <div className="success-message">✓ {success}</div>}
            <div className="otp-container">
              <p>
                We've sent a 6-digit OTP to <strong>{userEmail}</strong>. Please enter it below to complete your login.
              </p>
              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className={`form-group ${otpError ? 'error' : ''}`}>
                  <label>Enter OTP</label>
                  <input
                    ref={otpInputRef}
                    type="text"
                    value={otp}
                    onChange={handleOtpChange}
                    placeholder="000000"
                    maxLength="6"
                    required
                    className="otp-input-single"
                    autoComplete="one-time-code"
                  />
                  {otpError && <div className="validation-error">⚠️ {otpError}</div>}
                </div>
                <button 
                  type="submit" 
                  className="btn-auth" 
                  disabled={loading || otp.length !== 6}
                >
                  {loading && <span className="loading-spinner"></span>}
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="btn-auth-secondary"
                  disabled={resendingOtp || loading}
                >
                  {resendingOtp ? 'Resending...' : 'Resend OTP'}
                </button>
              </form>
            </div>
            <div className="auth-links">
              <p>
                <Link to="/login" onClick={() => setShowOtpStep(false)}>← Back to Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <Link to="/" className="back-to-home">
        ← Back to Home
      </Link>
      <div className="auth-container">
        <div className="auth-card">
          <h2>Login</h2>
          {error && <div className="error-message">⚠️ {error}</div>}
          {success && <div className="success-message">✓ {success}</div>}
          <form onSubmit={handleLogin} className="auth-form">
            <div className={`form-group ${usernameError ? 'error' : ''} ${username && !usernameError ? 'success' : ''}`}>
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError('');
                  setError('');
                }}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
              {usernameError && <div className="validation-error">⚠️ {usernameError}</div>}
            </div>
            <div className={`form-group ${passwordError ? 'error' : ''} ${password && !passwordError ? 'success' : ''}`}>
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                    setError('');
                  }}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {passwordError && <div className="validation-error">⚠️ {passwordError}</div>}
            </div>
            <button 
              type="submit" 
              className="btn-auth" 
              disabled={loading}
            >
              {loading && <span className="loading-spinner"></span>}
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="auth-links">
            <p>
              Don't have an account? <Link to="/register">Register</Link>
            </p>
            <p>
              <Link to="/forgot-password">Forgot password?</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

