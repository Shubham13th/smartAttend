import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import './Header.css';

const Header = ({ isAuthenticated, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo" onClick={() => handleNavigation('/')}>
          <h1>SmartAttend</h1>
        </div>

        {/* Mobile menu toggle */}
        <button className="mobile-menu-toggle" onClick={toggleMenu}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <nav className={`nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {isAuthenticated ? (
            <>
              <button 
                onClick={() => handleNavigation('/dashboard')} 
                className={`nav-button ${location.pathname === '/dashboard' ? 'active' : ''}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => handleNavigation('/face-detection')} 
                className={`nav-button ${location.pathname === '/face-detection' ? 'active' : ''}`}
              >
                Face Detection
              </button>
              <button 
                onClick={() => handleNavigation('/employees')} 
                className={`nav-button ${location.pathname === '/employees' ? 'active' : ''}`}
              >
                Employees
              </button>
              <button 
                onClick={() => handleNavigation('/manage-employees')} 
                className={`nav-button ${location.pathname === '/manage-employees' ? 'active' : ''}`}
              >
                Manage Employees
              </button>
              <button 
                onClick={() => handleNavigation('/reports')} 
                className={`nav-button ${location.pathname === '/reports' ? 'active' : ''}`}
              >
                Reports
              </button>
              <button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="nav-button logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => handleNavigation('/login')} className="nav-button login">
                Login
              </button>
              <button onClick={() => handleNavigation('/register')} className="nav-button register">
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