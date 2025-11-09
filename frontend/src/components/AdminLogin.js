import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { fetchUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Use admin-specific login endpoint
      const response = await api.post('/auth/admin/login', { username, password });
      
      const { access_token, user } = response.data;
      
      if (access_token && user) {
        // Verify it's actually an admin
        if (user.role !== 'admin') {
          setError('Access denied. This is an admin-only login page.');
          return;
        }
        
        // Store token and set authorization header
        localStorage.setItem('token', access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        // Fetch user data to update auth context
        await fetchUser();
        
        // Admin login successful - navigate to admin dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 200);
      } else {
        setError('Login failed. Invalid response from server.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
      <div className="card">
        <h2>Admin Login</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
          This page is for administrators only. Regular users should use the <Link to="/login">regular login</Link>.
        </p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Admin Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter admin username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter admin password"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Admin Login
          </button>
        </form>
        <p style={{ marginTop: '15px', textAlign: 'center' }}>
          <Link to="/login">Regular User Login</Link>
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;

