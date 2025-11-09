import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Profile() {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    date_of_birth: '',
    employment_status: '',
    annual_income: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // Ensure token is in headers before making request
      const token = localStorage.getItem('token');
      console.log('fetchProfile - token exists:', !!token);
      
      if (!token) {
        console.warn('No token found when fetching profile');
        return;
      }
      
      // Ensure token is set in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('fetchProfile - making API call to /profile');
      
      const response = await api.get('/profile');
      console.log('fetchProfile - response received:', response.data);
      
      if (response.data.profile) {
        const profile = response.data.profile;
        setFormData({
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          phone: profile.phone || '',
          address: profile.address || '',
          date_of_birth: profile.date_of_birth || '',
          employment_status: profile.employment_status || '',
          annual_income: profile.annual_income || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      console.error('Error response:', error.response);
      // Don't show error for 401 - it will be handled by interceptor
      if (error.response?.status !== 401) {
        console.error('Profile fetch error details:', error);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Ensure annual_income is sent as a number (not null or empty string)
      const submitData = {
        ...formData,
        annual_income: formData.annual_income && formData.annual_income !== '' 
          ? parseFloat(formData.annual_income) 
          : null
      };
      
      // Validate that annual_income is a valid number
      if (!submitData.annual_income || isNaN(submitData.annual_income)) {
        setError('Annual income must be a valid number');
        return;
      }
      
      console.log('Submitting profile data:', submitData);
      
      const response = await api.post('/profile', submitData);
      setSuccess('Profile saved successfully!');
      await fetchUser();
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Profile save error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      let errorMessage = 'Failed to save profile';
      
      if (err.response) {
        // Server responded with an error
        errorMessage = err.response.data?.error || 
                     err.response.data?.message || 
                     `Server error: ${err.response.status} ${err.response.statusText}`;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check if the backend is running.';
      } else {
        // Something else happened
        errorMessage = err.message || 'Failed to save profile';
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <h1>Complete Your Profile</h1>
      <div className="card">
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name *</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name *</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Date of Birth *</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Employment Status *</label>
            <select
              name="employment_status"
              value={formData.employment_status}
              onChange={handleChange}
              required
            >
              <option value="">Select...</option>
              <option value="Employed">Employed</option>
              <option value="Self-Employed">Self-Employed</option>
              <option value="Unemployed">Unemployed</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
          <div className="form-group">
            <label>Annual Income ($) *</label>
            <input
              type="number"
              name="annual_income"
              value={formData.annual_income}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;

