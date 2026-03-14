import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './Home.css';

const Home = ({ isAuthenticated }) => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">Experience the Future of<br /><span className="text-gradient-primary">Smart Attendance</span></h1>
        <p className="hero-subtitle">
          Secure, fast, and frictionless facial recognition attendance system designed for modern remote and on-premise teams.
        </p>

        <div className="cta-buttons">
          {isAuthenticated ? (
            <>
              <button 
                className="cta-button primary" 
                onClick={() => navigate('/face-detection')}
              >
                Start Face Detection
                <span style={{ marginLeft: '0.2rem' }}>→</span>
              </button>
              <button 
                className="cta-button secondary" 
                onClick={() => navigate('/dashboard')}
              >
                View Dashboard
              </button>
            </>
          ) : (
            <>
              <button 
                className="cta-button primary" 
                onClick={() => navigate('/login')}
              >
                Get Started
                <span style={{ marginLeft: '0.2rem' }}>→</span>
              </button>
              <button 
                className="cta-button secondary" 
                onClick={() => navigate('/register')}
              >
                Create Company Account
              </button>
            </>
          )}
        </div>
      </div>

      <div className="features-grid">
        <div className="glass-card feature-card">
          <div className="feature-icon">👁️</div>
          <h3>Facial Recognition</h3>
          <p>Advanced AI models detect and verify employees instantly, preventing proxy attendance and ensuring accurate records.</p>
        </div>
        <div className="glass-card feature-card">
          <div className="feature-icon">📊</div>
          <h3>Real-time Analytics</h3>
          <p>Monitor your workforce with live dashboards, detailed attendance reports, and department-wise statistics.</p>
        </div>
        <div className="glass-card feature-card">
          <div className="feature-icon">🏢</div>
          <h3>Company Management</h3>
          <p>Easily manage departments, employee positions, and access controls from a centralized glassmorphic admin panel.</p>
        </div>
      </div>
    </div>
  );
};

Home.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired
};

export default Home;