import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <h1>SmartAttend</h1>
          </div>
          <nav className="nav-menu">
            <button onClick={() => navigate('/dashboard')} className="nav-button">
              Dashboard
            </button>
            <button onClick={() => navigate('/face-detection')} className="nav-button">
              Face Detection
            </button>
            <button onClick={() => navigate('/employees')} className="nav-button">
              Employees
            </button>
            <button onClick={() => navigate('/attendance')} className="nav-button">
              Attendance
            </button>
            <button onClick={() => navigate('/login')} className="nav-button">
              Login
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="hero-section">
          <h2>Welcome to SmartAttend</h2>
          <p>Smart Attendance System using Face Recognition</p>
          <div className="cta-buttons">
            <button onClick={() => navigate('/face-detection')} className="cta-button">
              Start Face Detection
            </button>
            <button onClick={() => navigate('/dashboard')} className="cta-button secondary">
              View Dashboard
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>SmartAttend</h3>
            <p>Smart Attendance System using Face Recognition Technology</p>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><button onClick={() => navigate('/dashboard')}>Dashboard</button></li>
              <li><button onClick={() => navigate('/face-detection')}>Face Detection</button></li>
              <li><button onClick={() => navigate('/employees')}>Employees</button></li>
              <li><button onClick={() => navigate('/attendance')}>Attendance</button></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Contact</h3>
            <p>Email: support@smartattend.com</p>
            <p>Phone: +1 234 567 890</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} SmartAttend. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home; 