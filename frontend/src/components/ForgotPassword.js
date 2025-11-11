import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './auth.css';

function ForgotPassword() {
  const [step, setStep] = useState('email'); // 'email', 'otp', 'password'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetId, setResetId] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const otpInputRef = useRef(null);
  const { fetchUser } = useAuth();
  const navigate = useNavigate();

  // Cooldown timer for resend OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Focus OTP input when OTP step is shown
  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  // Calculate password strength
  useEffect(() => {
    if (newPassword) {
      let strength = 0;
      if (newPassword.length >= 8) strength++;
      if (newPassword.length >= 12) strength++;
      if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength++;
      if (/\d/.test(newPassword)) strength++;
      if (/[^a-zA-Z\d]/.test(newPassword)) strength++;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [newPassword]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEmailError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        setResetId(response.data.reset_id);
        setSuccess('If this email exists in our system, we have sent an OTP to your email.');
        setStep('otp');
        setResendCooldown(60);
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to send OTP. Please try again.');
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
      const response = await api.post('/auth/forgot-password/verify', {
        reset_id: resetId,
        otp: otp
      });
      
      if (response.data.success) {
        setResetToken(response.data.reset_token);
        setSuccess('OTP verified successfully! You can now reset your password.');
        setStep('password');
      } else {
        setError(response.data.error || 'Invalid OTP. Please try again.');
        setOtpError('Invalid OTP');
      }
    } catch (err) {
      const attemptsLeft = err.response?.data?.attempts_left;
      if (attemptsLeft !== undefined) {
        setError(err.response?.data?.error || `Invalid OTP. ${attemptsLeft} attempts left.`);
        setOtpError(`Invalid OTP. ${attemptsLeft} attempts left.`);
      } else {
        setError(err.response?.data?.error || err.message || 'OTP verification failed. Please try again.');
        setOtpError('Invalid OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setOtpError('');
    if (value.length === 6) {
      setTimeout(() => {
        if (otpInputRef.current) {
          otpInputRef.current.form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }, 100);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) {
      return;
    }

    setResendingOtp(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        // Update reset_id if provided (user exists)
        if (response.data.reset_id) {
          setResetId(response.data.reset_id);
        }
        setSuccess('If this email exists in our system, we have sent an OTP to your email.');
        setResendCooldown(60); // 60 second cooldown
        // Clear OTP field for new entry
        setOtp('');
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendingOtp(false);
    }
  };

  const validatePassword = () => {
    setPasswordError('');
    if (!newPassword) {
      setPasswordError('Password is required');
      return false;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password/reset', {
        reset_token: resetToken,
        new_password: newPassword
      });
      
      if (response.data.success) {
        const { access_token, user } = response.data;
        if (access_token && user) {
          localStorage.setItem('token', access_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          setSuccess('Password reset successfully! Logging you in...');
          
          await fetchUser();
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        } else {
          setError('Password reset successful, but login failed. Please login manually.');
        }
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Email step
  if (step === 'email') {
    return (
      <div className="auth-page">
        <Link to="/" className="back-to-home">
          ← Back to Home
        </Link>
        <div className="auth-container">
          <div className="auth-card">
            <h2>Forgot Password</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
              Enter your email address and we'll send you an OTP to reset your password.
            </p>
            {error && <div className="error-message">⚠️ {error}</div>}
            {success && <div className="success-message">✓ {success}</div>}
            <form onSubmit={handleRequestOtp} className="auth-form">
              <div className={`form-group ${emailError ? 'error' : email && !emailError ? 'success' : ''}`}>
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                    setError('');
                  }}
                  onBlur={() => {
                    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                      setEmailError('Please enter a valid email address');
                    }
                  }}
                  placeholder="Enter your email address"
                  required
                  autoComplete="email"
                />
                {emailError && <div className="validation-error">⚠️ {emailError}</div>}
              </div>
              <button type="submit" className="btn-auth" disabled={loading}>
                {loading && <span className="loading-spinner"></span>}
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
            <div className="auth-links">
              <p>
                <Link to="/login">← Back to Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // OTP verification step
  if (step === 'otp') {
    return (
      <div className="auth-page">
        <Link to="/" className="back-to-home">
          ← Back to Home
        </Link>
        <div className="auth-container">
          <div className="auth-card">
            <h2>Verify OTP</h2>
            {error && <div className="error-message">⚠️ {error}</div>}
            {success && <div className="success-message">✓ {success}</div>}
            <div className="otp-container">
              <p>
                We've sent a 6-digit OTP to <strong>{email}</strong>. Please enter it below to continue.
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
                  disabled={resendingOtp || resendCooldown > 0 || loading}
                >
                  {resendingOtp ? 'Resending...' : resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                </button>
              </form>
            </div>
            <div className="auth-links">
              <p>
                <Link to="/login">← Back to Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Password reset step
  if (step === 'password') {
    const getPasswordStrengthClass = () => {
      if (passwordStrength <= 2) return 'password-strength-weak';
      if (passwordStrength <= 3) return 'password-strength-medium';
      return 'password-strength-strong';
    };

    const getPasswordStrengthLabel = () => {
      if (passwordStrength <= 2) return 'Weak';
      if (passwordStrength <= 3) return 'Medium';
      return 'Strong';
    };

    return (
      <div className="auth-page">
        <Link to="/" className="back-to-home">
          ← Back to Home
        </Link>
        <div className="auth-container">
          <div className="auth-card">
            <h2>Reset Password</h2>
            {error && <div className="error-message">⚠️ {error}</div>}
            {success && <div className="success-message">✓ {success}</div>}
            <p style={{ marginBottom: '20px', color: '#666', textAlign: 'center' }}>
              Enter your new password. It must be at least 8 characters long.
            </p>
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className={`form-group ${passwordError ? 'error' : newPassword && !passwordError && passwordStrength >= 3 ? 'success' : ''}`}>
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError('');
                      setError('');
                    }}
                    placeholder="Enter new password"
                    minLength="8"
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
                {newPassword && (
                  <>
                    <div className="password-strength">
                      <div className={`password-strength-bar ${getPasswordStrengthClass()}`} style={{ width: `${(passwordStrength / 5) * 100}%` }}></div>
                    </div>
                    <div className="password-strength-text">
                      Password strength: <strong>{getPasswordStrengthLabel()}</strong>
                    </div>
                  </>
                )}
                {passwordError && <div className="validation-error">⚠️ {passwordError}</div>}
              </div>
              <div className={`form-group ${confirmPassword && newPassword !== confirmPassword ? 'error' : confirmPassword && newPassword === confirmPassword ? 'success' : ''}`}>
                <label>Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError('');
                      setError('');
                    }}
                    placeholder="Confirm new password"
                    minLength="8"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirmPassword && newPassword && newPassword !== confirmPassword && (
                  <div className="validation-error">⚠️ Passwords do not match</div>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <div className="validation-success">✓ Passwords match</div>
                )}
              </div>
              <button type="submit" className="btn-auth" disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}>
                {loading && <span className="loading-spinner"></span>}
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
            <div className="auth-links">
              <p>
                <Link to="/login">← Back to Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default ForgotPassword;

