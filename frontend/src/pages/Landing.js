import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <nav className="navbar">
        <div className="logo">SecureShare</div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/login')} className="btn-outline">Login</button>
          <button onClick={() => navigate('/register')} className="btn-primary">Get Started</button>
        </div>
      </nav>

      <section className="hero">
        <h1 className="hero-title">Enterprise-grade file sharing made accessible</h1>
        <p className="hero-subtitle">Share files up to 30GB securely with military-grade encryption</p>
        <div className="hero-buttons">
          <button onClick={() => navigate('/register')} className="btn-large">Get Started Free</button>
          <button onClick={() => navigate('/login')} className="btn-outline-large">Sign In</button>
        </div>
      </section>

      <section className="features">
        <h2>Why Choose SecureShare?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📤</div>
            <h3>Large Uploads</h3>
            <p>Upload files up to 30GB with chunked transfer for reliability</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>AES Encryption</h3>
            <p>Military-grade 256-bit encryption protects your files</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3>Secure Links</h3>
            <p>Generate unique shareable links with one click</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Dashboard</h3>
            <p>Manage all your files from a centralized dashboard</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
