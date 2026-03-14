import PropTypes from 'prop-types';
import './Footer.css';

const Footer = ({ isAuthenticated }) => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} SmartAttend. All rights reserved.</p>
        <div className="footer-links">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Contact</span>
        </div>
      </div>
    </footer>
  );
};

Footer.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired
};

export default Footer;