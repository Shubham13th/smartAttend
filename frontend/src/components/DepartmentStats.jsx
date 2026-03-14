import PropTypes from 'prop-types';
import './DepartmentStats.css';

const DepartmentStats = ({ stats }) => {
  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="department-stats" style={{ color: 'var(--text-muted)' }}>
        No department data available.
      </div>
    );
  }

  // Calculate proportional bar color based on rate (0 to 100)
  const getRateColor = (rate) => {
    if (rate >= 90) return 'var(--accent-success)';
    if (rate >= 75) return 'var(--accent-primary)';
    if (rate >= 50) return 'var(--accent-warning)';
    return 'var(--accent-danger)';
  };

  return (
    <div className="department-stats">
      <div className="department-list">
        {Object.entries(stats).map(([department, data]) => (
          <div key={department} className="department-item">
            
            <div className="dept-name">
              {department}
            </div>
            
            <div className="dept-stat">
              <span className="dept-stat-label">Total</span>
              <span className="dept-stat-value">{data.total}</span>
            </div>
            
            <div className="dept-stat">
              <span className="dept-stat-label">Present</span>
              <span className="dept-stat-value">{data.present}</span>
            </div>
            
            <div className="rate-container">
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${data.rate}%`,
                    backgroundColor: getRateColor(data.rate)
                  }}
                ></div>
              </div>
              <span className="rate-value">{data.rate}%</span>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

DepartmentStats.propTypes = {
  stats: PropTypes.objectOf(
    PropTypes.shape({
      total: PropTypes.number.isRequired,
      present: PropTypes.number.isRequired,
      rate: PropTypes.number.isRequired
    })
  ).isRequired
};

export default DepartmentStats;