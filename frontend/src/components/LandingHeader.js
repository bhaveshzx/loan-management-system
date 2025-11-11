import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    setIsMenuOpen(false);
    
    // If we're not on the home page, navigate there first with hash
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`, { replace: true });
      // Wait for navigation and then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return;
    }
    
    // If we're already on home page, just scroll
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      // Update URL hash without scrolling again
      window.history.replaceState(null, '', `#${sectionId}`);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMenuOpen && !e.target.closest('.landing-header')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMenuOpen]);

  return (
    <header className={`landing-header ${isMenuOpen ? 'menu-open' : ''}`}>
      <div className="landing-header-content">
        <div className="landing-logo-wrapper">
          <Link to="/" className="landing-logo-link">
            <span className="landing-logo-text">
              <span className="landing-logo-black">LM</span>
              <span className="landing-logo-orange">S</span>
            </span>
          </Link>
        </div>
        
        <nav className={`landing-nav ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/" onClick={(e) => scrollToSection(e, 'home')} className="nav-link">Home</Link>
          <Link to="/" onClick={(e) => scrollToSection(e, 'about')} className="nav-link">About</Link>
          <Link to="/register" onClick={() => setIsMenuOpen(false)} className="nav-link">Apply Loan</Link>
          <Link to="/" onClick={(e) => scrollToSection(e, 'faq')} className="nav-link">FAQ's</Link>
          <Link to="/" onClick={(e) => scrollToSection(e, 'contact')} className="nav-link">Contact</Link>
          <Link to="/" onClick={(e) => scrollToSection(e, 'blog')} className="nav-link">Blog</Link>
          {/* <div className="mobile-menu-actions">
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn-login-mobile">LOGIN</Link>
            <Link to="/register" onClick={() => setIsMenuOpen(false)} className="btn-register-mobile">REGISTER</Link>
          </div> */}
        </nav>

        <div className="landing-header-actions">
          <Link to="/login" className="btn-login">LOGIN</Link>
          <Link to="/register" className="btn-register">REGISTER</Link>
        </div>

        <button 
          className="hamburger-menu" 
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}

export default LandingHeader;

