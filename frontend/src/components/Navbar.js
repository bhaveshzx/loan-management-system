import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LMSLogo from './LMSLogo';
import './dashboard.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <LMSLogo />
        <div className="navbar-links">
          <Link 
            to="/dashboard" 
            className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            <span></span>
            Dashboard
          </Link>
          {user?.role === 'admin' ? (
            <Link 
              to="/loans" 
              className={`navbar-link ${isActive('/loans') ? 'active' : ''}`}
            >
              <span></span>
              All Loans
            </Link>
          ) : (
            <>
              <Link 
                to="/profile" 
                className={`navbar-link ${isActive('/profile') ? 'active' : ''}`}
              >
                <span></span>
                Profile
              </Link>
              <Link 
                to="/loans" 
                className={`navbar-link ${isActive('/loans') ? 'active' : ''}`}
              >
                <span></span>
                My Loans
              </Link>
            </>
          )}
          <div className="navbar-user-info">
            {/* <span className="navbar-welcome">Welcome, <strong>{user?.username}</strong></span> */}
            {showLogoutConfirm ? (
              <div className="logout-confirm">
                <span>Confirm logout?</span>
                <button className="logout-btn-confirm" onClick={handleLogout}>
                  Yes
                </button>
                <button className="logout-btn-cancel" onClick={() => setShowLogoutConfirm(false)}>
                  No
                </button>
              </div>
            ) : (
              <button 
                className="logout-btn" 
                onClick={() => setShowLogoutConfirm(true)}
                onBlur={() => setTimeout(() => setShowLogoutConfirm(false), 200)}
              >
                <span></span>
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

