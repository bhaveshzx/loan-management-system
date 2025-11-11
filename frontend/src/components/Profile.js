import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './dashboard.css';
import './auth.css';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found when fetching profile');
        setLoading(false);
        return;
      }
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get('/profile');
      
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
      if (error.response?.status !== 401) {
        setError('Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name, value) => {
    const errors = { ...fieldErrors };
    delete errors[name];
    
    switch (name) {
      case 'first_name':
      case 'last_name':
        if (value && value.length < 2) {
          errors[name] = 'Must be at least 2 characters';
        }
        break;
      case 'phone':
        if (value && !/^[\d\s\-()+]+$/.test(value)) {
          errors[name] = 'Invalid phone number format';
        }
        break;
      case 'annual_income':
        if (value && (isNaN(value) || parseFloat(value) < 0)) {
          errors[name] = 'Must be a valid positive number';
        }
        break;
      case 'date_of_birth':
        if (value) {
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 18) {
            errors[name] = 'Must be at least 18 years old';
          }
        }
        break;
      default:
        break;
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
    if (fieldErrors[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    validateField(e.target.name, e.target.value);
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
      isValid = false;
    }
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
      isValid = false;
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone is required';
      isValid = false;
    }
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
      isValid = false;
    }
    if (!formData.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required';
      isValid = false;
    }
    if (!formData.employment_status) {
      errors.employment_status = 'Employment status is required';
      isValid = false;
    }
    if (!formData.annual_income || isNaN(formData.annual_income) || parseFloat(formData.annual_income) <= 0) {
      errors.annual_income = 'Valid annual income is required';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }

    setSaving(true);

    try {
      const submitData = {
        ...formData,
        annual_income: parseFloat(formData.annual_income)
      };
      
      await api.post('/profile', submitData);
      setSuccess('Profile saved successfully! Redirecting...');
      await fetchUser();
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      let errorMessage = 'Failed to save profile';
      
      if (err.response) {
        errorMessage = err.response.data?.error || 
                     err.response.data?.message || 
                     `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = err.message || 'Failed to save profile';
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner-large"></div>
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Complete Your Profile</h1>
          <p className="dashboard-welcome">Please provide your information to continue</p>
        </div>
      </div>

      <div className="quick-actions-card">
        {error && <div className="error-message">⚠️ {error}</div>}
        {success && <div className="success-message">✓ {success}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className={`form-group ${fieldErrors.first_name ? 'error' : formData.first_name ? 'success' : ''}`}>
            <label>First Name *</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your first name"
              required
            />
            {fieldErrors.first_name && <div className="validation-error">⚠️ {fieldErrors.first_name}</div>}
          </div>

          <div className={`form-group ${fieldErrors.last_name ? 'error' : formData.last_name ? 'success' : ''}`}>
            <label>Last Name *</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your last name"
              required
            />
            {fieldErrors.last_name && <div className="validation-error">⚠️ {fieldErrors.last_name}</div>}
          </div>

          <div className={`form-group ${fieldErrors.phone ? 'error' : formData.phone ? 'success' : ''}`}>
            <label>Phone *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your phone number"
              required
            />
            {fieldErrors.phone && <div className="validation-error">⚠️ {fieldErrors.phone}</div>}
          </div>

          <div className={`form-group ${fieldErrors.address ? 'error' : formData.address ? 'success' : ''}`}>
            <label>Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your address"
              rows="3"
              required
            />
            {fieldErrors.address && <div className="validation-error">⚠️ {fieldErrors.address}</div>}
          </div>

          <div className={`form-group ${fieldErrors.date_of_birth ? 'error' : formData.date_of_birth ? 'success' : ''}`}>
            <label>Date of Birth *</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              onBlur={handleBlur}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              required
            />
            {fieldErrors.date_of_birth && <div className="validation-error">⚠️ {fieldErrors.date_of_birth}</div>}
          </div>

          <div className={`form-group ${fieldErrors.employment_status ? 'error' : formData.employment_status ? 'success' : ''}`}>
            <label>Employment Status *</label>
            <select
              name="employment_status"
              value={formData.employment_status}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            >
              <option value="">Select employment status...</option>
              <option value="Employed">Employed</option>
              <option value="Self-Employed">Self-Employed</option>
              <option value="Unemployed">Unemployed</option>
              <option value="Retired">Retired</option>
            </select>
            {fieldErrors.employment_status && <div className="validation-error">⚠️ {fieldErrors.employment_status}</div>}
          </div>

          <div className={`form-group ${fieldErrors.annual_income ? 'error' : formData.annual_income ? 'success' : ''}`}>
            <label>Annual Income ($) *</label>
            <input
              type="number"
              name="annual_income"
              value={formData.annual_income}
              onChange={handleChange}
              onBlur={handleBlur}
              min="0"
              step="0.01"
              placeholder="Enter your annual income"
              required
            />
            {fieldErrors.annual_income && <div className="validation-error">⚠️ {fieldErrors.annual_income}</div>}
            {formData.annual_income && !fieldErrors.annual_income && (
              <div className="validation-success">✓ Income looks good</div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-auth" 
            disabled={saving}
            style={{ marginTop: '10px' }}
          >
            {saving && <span className="loading-spinner"></span>}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;

