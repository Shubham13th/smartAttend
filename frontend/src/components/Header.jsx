import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './Header.css';

const Header = ({ isAuthenticated, onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo" onClick={() => navigate('/')}>
          <h1>SmartAttend</h1>
        </div>
        <nav className="nav-menu">
          {isAuthenticated ? (
            <>
              <button onClick={() => navigate('/dashboard')} className="nav-button">
                Dashboard
              </button>
              <button onClick={() => navigate('/face-detection')} className="nav-button">
                Face Detection
              </button>
              <button onClick={() => navigate('/employees')} className="nav-button">
                Employees
              </button>
              <button onClick={() => navigate('/manage-employees')} className="nav-button">
                Manage Employees
              </button>
              <button onClick={onLogout} className="nav-button logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="nav-button">
                Login
              </button>
              <button onClick={() => navigate('/register')} className="nav-button">
                Register
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

Header.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired
};

export default Header; 