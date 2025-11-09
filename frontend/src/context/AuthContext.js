import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('AuthContext useEffect - token exists:', !!token);
    console.log('AuthContext useEffect - current user:', user);
    
    // Only fetch user if we have a token but no user yet
    if (token && !user) {
      console.log('Token found but no user - fetching user...');
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else if (!token) {
      console.log('No token found - setting loading to false');
      setLoading(false);
      setUser(null);
    } else {
      // We have both token and user - just ensure loading is false
      console.log('Token and user both exist - setting loading to false');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('fetchUser called - token exists:', !!token);
      
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }
      
      // Ensure token is set in headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('Calling /auth/me endpoint...');
      const response = await api.get('/auth/me');
      console.log('fetchUser response:', response.data);
      
      if (response.data && response.data.user) {
        setUser(response.data.user);
        console.log('User set successfully:', response.data.user);
      } else {
        console.warn('No user data in response');
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      console.error('Error response:', error.response);
      
      // Only remove token if it's actually invalid (401), not for network errors
      if (error.response?.status === 401) {
        console.log('401 error - removing token');
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
      } else if (error.response?.status === 422) {
        console.log('422 error - token might be malformed');
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
      }
      // For other errors (network, 500, etc), keep the token and user state
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      console.log('Login function called for:', username);
      
      // Make login request without Authorization header (it's a public endpoint)
      const response = await api.post('/auth/login', { username, password });
      console.log('Login API response:', response.data);
      
      // Check if OTP is required
      if (response.data.requires_otp === false) {
        // Admin login - no OTP required, login directly
        const { access_token, user } = response.data;
        if (access_token && user) {
          localStorage.setItem('token', access_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          setUser(user);
          setLoading(false);
          return user;
        }
      }
      
      // Regular user - returns pending_login_id (handled in Login component)
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      console.error('Login error response:', error.response);
      console.error('Login error data:', error.response?.data);
      throw error;
    }
  };

  const verifyOtpAndLogin = async (pendingLoginId, otp) => {
    try {
      const response = await api.post('/auth/verify-login-otp', {
        pending_login_id: pendingLoginId,
        otp: otp
      });
      
      const { access_token, user } = response.data;
      
      if (access_token && user) {
        localStorage.setItem('token', access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        setUser(user);
        setLoading(false);
        return user;
      } else {
        throw new Error('No access token or user received');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password });
    const { access_token, user } = response.data;
    if (access_token) {
      localStorage.setItem('token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(user);
      return user;
    } else {
      throw new Error('No access token received');
    }
  };

  const verifyOtpAndRegister = async (pendingRegistrationId, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', {
        pending_registration_id: pendingRegistrationId,
        otp: otp
      });
      
      const { access_token, user } = response.data;
      
      if (access_token && user) {
        localStorage.setItem('token', access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        setUser(user);
        setLoading(false);
        return user;
      } else {
        throw new Error('No access token or user received');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    fetchUser,
    verifyOtpAndRegister,
    verifyOtpAndLogin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

