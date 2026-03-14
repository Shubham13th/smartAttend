import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './EmptyState.css';

const EmptyState = ({ companyName }) => {
  const navigate = useNavigate();

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        👋
      </div>
      <h3>Welcome to {companyName || 'your new workspace'}!</h3>
      <p>
        Your employee directory is currently empty. Get started by registering your first employee using our secure facial recognition system.
      </p>
      <button 
        onClick={() => navigate('/face-detection')}
        className="action-btn primary"
      >
        Launch Scanner
      </button>
    </div>
  );
};

EmptyState.propTypes = {
  companyName: PropTypes.string
};

export default EmptyState;