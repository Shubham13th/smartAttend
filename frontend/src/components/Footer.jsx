import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './Footer.css';

const Footer = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-sections">
          <div className="footer-section">
            <h3>SmartAttend</h3>
            <p>Smart attendance tracking system using face recognition technology.</p>
          </div>

          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              {isAuthenticated ? (
                <>
                  <li><button onClick={() => navigate('/dashboard')}>Dashboard</button></li>
                  <li><button onClick={() => navigate('/face-detection')}>Face Detection</button></li>
                  <li><button onClick={() => navigate('/employees')}>Employees</button></li>
                  <li><button onClick={() => navigate('/manage-employees')}>Manage Employees</button></li>
                </>
              ) : (
                <>
                  <li><button onClick={() => navigate('/login')}>Login</button></li>
                  <li><button onClick={() => navigate('/register')}>Register</button></li>
                </>
              )}
            </ul>
          </div>

          <div className="footer-section">
            <h3>Contact</h3>
            <p>Email: support@smartattend.com</p>
            <p>Phone: +1 234 567 890</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} SmartAttend. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

Footer.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired
};

export default Footer; 