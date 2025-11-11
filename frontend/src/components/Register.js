import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './auth.css';

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
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [otpError, setOtpError] = useState('');
  const otpInputRef = useRef(null);
  const { verifyOtpAndRegister } = useAuth();
  const navigate = useNavigate();

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    if (!password) return { strength: 0, label: '', className: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) {
      return { strength: 1, label: 'Weak', className: 'password-strength-weak' };
    } else if (strength <= 3) {
      return { strength: 2, label: 'Medium', className: 'password-strength-medium' };
    } else {
      return { strength: 3, label: 'Strong', className: 'password-strength-strong' };
    }
  }, [password]);

  // Focus OTP input when OTP step is shown
  useEffect(() => {
    if (showOtpStep && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [showOtpStep]);

  const validateForm = () => {
    let isValid = true;
    setUsernameError('');
    setEmailError('');
    setPasswordError('');

    // Validate username
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      isValid = false;
    }

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password should be at least 8 characters for better security');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUsernameError('');
    setEmailError('');
    setPasswordError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', { username, email, password });
      setPendingRegistrationId(response.data.pending_registration_id);
      setShowOtpStep(true);
      setSuccess('OTP sent to your email. Please check your inbox.');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
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
      const user = await verifyOtpAndRegister(pendingRegistrationId, otp);
      setSuccess('Registration successful! Redirecting to complete your profile...');
      setTimeout(() => {
        navigate('/profile');
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
            <h2>Verify Email</h2>
            {error && <div className="error-message">⚠️ {error}</div>}
            {success && <div className="success-message">✓ {success}</div>}
            <div className="otp-container">
              <p>
                We've sent a 6-digit OTP to <strong>{email}</strong>. Please enter it below to complete your registration.
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
                <Link to="/login">Already have an account? Login</Link>
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
          <h2>Register</h2>
          {error && <div className="error-message">⚠️ {error}</div>}
          {success && <div className="success-message">✓ {success}</div>}
          <form onSubmit={handleRegister} className="auth-form">
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
              {username && !usernameError && <div className="validation-success">✓ Username looks good</div>}
            </div>
            <div className={`form-group ${emailError ? 'error' : ''} ${email && !emailError ? 'success' : ''}`}>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                  setError('');
                }}
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
              {emailError && <div className="validation-error">⚠️ {emailError}</div>}
              {email && !emailError && <div className="validation-success">✓ Email looks good</div>}
            </div>
            <div className={`form-group ${passwordError ? 'error' : ''} ${password && !passwordError && passwordStrength.strength >= 2 ? 'success' : ''}`}>
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
                  autoComplete="new-password"
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
              {password && (
                <>
                  <div className="password-strength">
                    <div className={`password-strength-bar ${passwordStrength.className}`}></div>
                  </div>
                  <div className="password-strength-text">
                    Password strength: <strong>{passwordStrength.label || 'None'}</strong>
                  </div>
                </>
              )}
              {passwordError && <div className="validation-error">⚠️ {passwordError}</div>}
              {password && !passwordError && passwordStrength.strength >= 2 && (
                <div className="validation-success">✓ Password strength is good</div>
              )}
            </div>
            <button 
              type="submit" 
              className="btn-auth" 
              disabled={loading}
            >
              {loading && <span className="loading-spinner"></span>}
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          <div className="auth-links">
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;

