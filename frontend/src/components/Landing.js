import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingHeader from './LandingHeader';
import './landing.css';

function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Handle hash navigation
  useEffect(() => {
    if (location.hash) {
      const sectionId = location.hash.substring(1); // Remove the # symbol
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.hash]);

  const handleApplyNow = () => {
    if (user) {
      navigate('/loans');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="landing-page">
      <LandingHeader />
      
      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Personal Loan to suit your needs</h1>
            <p className="hero-subtitle">
              Get quick and easy personal loans with attractive interest rates and flexible repayment tenures. 
              Experience seamless application process with secure OTP verification and transparent terms.
            </p>
            <button className="btn-apply-now" onClick={handleApplyNow} aria-label="Apply for loan now">
              APPLY NOW
            </button>
          </div>
          <div className="hero-image">
            <div className="hero-placeholder">
              <svg width="500" height="400" viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="500" height="400" fill="#f0f0f0"/>
                <circle cx="250" cy="200" r="80" fill="#f58220" opacity="0.3"/>
                <path d="M200 150 L250 100 L300 150 L280 200 L220 200 Z" fill="#f58220" opacity="0.5"/>
                <text x="250" y="220" textAnchor="middle" fill="#333" fontSize="20" fontWeight="600">Finance & Loans</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="container">
          <h2 className="section-title">About Us</h2>
          <p className="about-text">
            Loan Management System (LMS) is committed to providing transparent, secure, and accessible financial 
            solutions to help you achieve your goals. We believe in building trust through transparent processes, 
            competitive rates, and exceptional customer service. Our mission is to make personal loans accessible 
            to everyone with a straightforward, secure, and efficient application process.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
            <div className="step-card">
              <div className="step-icon">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="30" cy="30" r="28" fill="#f58220" opacity="0.1"/>
                  <path d="M20 30 L28 38 L40 22" stroke="#f58220" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="step-title">Apply Online</h3>
              <p className="step-description">
                Fill out a simple online application form with your basic details and loan requirements. 
                The process takes just a few minutes.
              </p>
            </div>
            <div className="step-card">
              <div className="step-icon">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="30" cy="30" r="28" fill="#f58220" opacity="0.1"/>
                  <rect x="18" y="22" width="24" height="16" rx="2" stroke="#f58220" strokeWidth="3"/>
                  <path d="M24 28 L30 34 L36 28" stroke="#f58220" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="step-title">OTP Verification</h3>
              <p className="step-description">
                Verify your email address with a secure OTP (One-Time Password) sent to your registered email. 
                Quick and secure verification process.
              </p>
            </div>
            <div className="step-card">
              <div className="step-icon">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="30" cy="30" r="28" fill="#f58220" opacity="0.1"/>
                  <path d="M30 18 L30 42 M18 30 L42 30" stroke="#f58220" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="30" cy="30" r="8" fill="#f58220"/>
                </svg>
              </div>
              <h3 className="step-title">Get Decision & Disbursement</h3>
              <p className="step-description">
                Receive a quick decision on your loan application. Once approved, funds are disbursed 
                directly to your account with transparent terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose LMS Section */}
      <section className="why-choose-section">
        <div className="container">
          <h2 className="section-title">Why Choose LMS</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Fast Approval</h3>
              <p className="feature-description">
                Quick loan processing and approval within minutes. Get instant decisions on your application.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Secure OTP & Auth</h3>
              <p className="feature-description">
                Bank-level security with OTP verification and encrypted authentication for your peace of mind.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3 className="feature-title">Competitive Rates</h3>
              <p className="feature-description">
                Enjoy attractive interest rates tailored to your profile. Transparent pricing with no hidden charges.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3 className="feature-title">Transparent Fees</h3>
              <p className="feature-description">
                Clear and upfront fee structure. No surprises, no hidden costs. Complete transparency in all transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <h2 className="section-title">What Our Customers Say</h2>
          <div className="testimonials-container">
            <div className="testimonial-card">
              <p className="testimonial-text">
                "LMS made getting a personal loan so easy and quick. The OTP verification was smooth, 
                and I got approved within hours. Highly recommended!"
              </p>
              <p className="testimonial-author">- Sarah Johnson</p>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">
                "Transparent process, competitive rates, and excellent customer service. 
                The online application was straightforward and secure."
              </p>
              <p className="testimonial-author">- Michael Chen</p>
            </div>
            <div className="testimonial-card">
              <p className="testimonial-text">
                "I needed funds urgently, and LMS delivered. Fast approval, clear terms, 
                and the money was in my account quickly. Great experience!"
              </p>
              <p className="testimonial-author">- Emma Williams</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact/CTA Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <div className="contact-content">
            <div className="contact-info">
              <h3 className="contact-title">Ready to Get Started?</h3>
              <p className="contact-text">Have questions? Contact us at:</p>
              {/* <p className="contact-phone">📞 +1 (555) 123-4567</p> */}
            </div>
            <button className="btn-get-started" onClick={handleApplyNow} aria-label="Get started with loan application">
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4 className="footer-title">LMS</h4>
              <p className="footer-text">Your trusted partner for personal loans.</p>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Quick Links</h4>
              <Link to="/" className="footer-link">Home</Link>
              <Link to="/login" className="footer-link">Login</Link>
              <Link to="/register" className="footer-link">Register</Link>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Contact</h4>
              <p className="footer-text">Email: info@loanmanagement.com</p>
              {/* <p className="footer-text">Phone: +1 (555) 123-4567</p> */}
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Loan Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Placeholder sections for FAQ and Blog (scroll anchors) */}
      <div id="faq" style={{ height: '1px' }}></div>
      <div id="blog" style={{ height: '1px' }}></div>
    </div>
  );
}

export default Landing;

