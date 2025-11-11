import axios from 'axios';

// Get API URL from environment variable or use relative path
const API_URL = process.env.REACT_APP_API_URL || '';
const baseURL = API_URL ? `${API_URL}/api` : '/api';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Request interceptor to add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // List of public endpoints that don't require authentication
    const publicEndpoints = [
      '/auth/register',
      '/auth/login',
      '/auth/verify-otp',
      '/auth/resend-otp',
      '/auth/verify-login-otp',
      '/auth/resend-login-otp',
      '/auth/forgot-password',
      '/auth/forgot-password/verify',
      '/auth/forgot-password/reset'
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    );
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (!isPublicEndpoint) {
      // Only warn for non-public endpoints that might need authentication
      console.warn('No token found in localStorage for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Response interceptor - error:', error.response?.status, error.config?.url);
    
    // Don't redirect for login/register endpoints
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                           error.config?.url?.includes('/auth/register');
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      const currentPath = window.location.pathname;
      const token = localStorage.getItem('token');
      
      console.log('401 error details:', {
        url: error.config?.url,
        currentPath,
        hasToken: !!token,
        isAuthEndpoint
      });
      
      // Only redirect if not already on login/register page
      // And only if we actually have a token (meaning it's invalid)
      if (currentPath !== '/login' && currentPath !== '/register' && token) {
        console.log('401 error with token - token is invalid, redirecting to login');
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        // Use a small delay to avoid redirect loops
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      } else if (!token) {
        console.log('401 error without token - token missing, not redirecting (might be expected)');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

