import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">Loan Management System</div>
        <div className="navbar-links">
          <Link to="/dashboard">Dashboard</Link>
          {user?.role === 'admin' ? (
            <>
              <Link to="/loans">All Loans</Link>
            </>
          ) : (
            <>
              <Link to="/profile">Profile</Link>
              <Link to="/loans">My Loans</Link>
            </>
          )}
          <span>Welcome, {user?.username}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

