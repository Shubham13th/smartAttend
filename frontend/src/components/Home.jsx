import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to SmartAttend</h1>
        <p className="subtitle">Smart Attendance System using Face Recognition</p>
        
        <div className="features">
          <div className="feature-card">
            <h3>Face Recognition</h3>
            <p>Advanced face detection and recognition technology for accurate attendance tracking</p>
          </div>
          
          <div className="feature-card">
            <h3>Real-time Tracking</h3>
            <p>Instant attendance marking and monitoring system</p>
          </div>
          
          <div className="feature-card">
            <h3>Easy Management</h3>
            <p>Simple and intuitive interface for managing student attendance</p>
          </div>
        </div>

        <div className="cta-buttons">
          <Link to="/login" className="cta-button primary">
            Login
          </Link>
          <Link to="/register" className="cta-button secondary">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home; 