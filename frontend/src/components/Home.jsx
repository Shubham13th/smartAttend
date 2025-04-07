import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './Home.css';

const Home = ({ isAuthenticated, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="home-container">
      {/* Main Content */}
      <main className="main-content">
        <div className="hero-section">
          <h2>Welcome to SmartAttend</h2>
          <p>Smart Attendance System using Face Recognition</p>
          <div className="cta-buttons">
            {isAuthenticated ? (
              <>
                <button onClick={() => navigate('/face-detection')} className="cta-button">
                  Start Face Detection
                </button>
                <button onClick={() => navigate('/dashboard')} className="cta-button secondary">
                  View Dashboard
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="cta-button">
                  Login
                </button>
                <button onClick={() => navigate('/register')} className="cta-button secondary">
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

Home.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired
};

export default Home; 