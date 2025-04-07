import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './EmptyState.css';

const EmptyState = ({ companyName }) => {
  const navigate = useNavigate();

  return (
    <div className="empty-state">
      <div className="empty-state-content">
        <h2>Welcome to SmartAttend!</h2>
        <p className="company-welcome">
          {companyName ? `Your company "${companyName}" has been set up successfully.` : 'Your company has been set up successfully.'}
        </p>
        <p className="empty-message">
          It looks like you haven&apos;t registered any employees yet. Start by adding employees to track their attendance.
        </p>
        <div className="empty-actions">
          <button 
            className="primary-action"
            onClick={() => navigate('/face-detection')}
          >
            Register Employees
          </button>
          <button 
            className="secondary-action"
            onClick={() => navigate('/employees')}
          >
            View Employees
          </button>
        </div>
      </div>
    </div>
  );
};

EmptyState.propTypes = {
  companyName: PropTypes.string
};

EmptyState.defaultProps = {
  companyName: ''
};

export default EmptyState; 