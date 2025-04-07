import React from 'react';
import './DepartmentStats.css';

const DepartmentStats = ({ stats }) => {
  return (
    <div className="department-stats">
      <h3>Department-wise Attendance</h3>
      <div className="department-grid">
        {Object.entries(stats).map(([dept, data]) => (
          <div key={dept} className="department-card">
            <h4>{dept}</h4>
            <div className="department-metrics">
              <div className="metric">
                <span className="label">Total:</span>
                <span className="value">{data.total}</span>
              </div>
              <div className="metric">
                <span className="label">Present:</span>
                <span className="value">{data.present}</span>
              </div>
              <div className="metric">
                <span className="label">Rate:</span>
                <span className="value">{data.rate}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentStats; 