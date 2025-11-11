import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LMSLogo() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <Link 
      to={user ? '/dashboard' : '/'} 
      onClick={handleLogoClick} 
      className="lms-logo"
    >
      <span className="lms-logo-text">
        <span className="lms-logo-black">LM</span>
        <span className="lms-logo-orange">S</span>
      </span>
    </Link>
  );
}

export default LMSLogo;

