import { useState, useEffect } from 'react';
import axios from 'axios';
import './Employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to view employees');
        return;
      }

      const response = await axios.get('https://smartattend-backend.vercel.app/api/employees', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && Array.isArray(response.data)) {
        setEmployees(response.data);
      } else {
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      if (error.response?.status === 401) {
        setError('Session expired. Please login again');
        window.location.href = '/login';
      } else {
        setError(error.response?.data?.message || 'Failed to fetch employees');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="employees-container employees-loading">
        <div className="loading-spinner"></div>
        <p>Loading your team...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employees-container employees-error">
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px' }}>
          <p className="error-message" style={{ border: 'none', background: 'transparent' }}>{error}</p>
          <button className="auth-button btn-retry" onClick={() => window.location.href = '/login'}>
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Get initials for the avatar
  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
  };

  return (
    <div className="employees-container">
      <div className="employees-page-header">
        <div className="title-section">
          <h1>Employees Directory</h1>
          <p>Browse and search your entire workforce</p>
        </div>
        
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="employees-grid">
        {filteredEmployees.map((employee) => (
          <div key={employee._id} className="glass-card employee-card">
            <div className="employee-header">
              <div className="employee-avatar">
                {getInitials(employee.name)}
              </div>
              <div className="employee-status">
                <span className={`status-badge ${employee.isActive ? 'active' : 'inactive'}`}>
                  {employee.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="employee-details">
              <h3 className="employee-name">{employee.name}</h3>
              <span className="employee-role">{employee.position}</span>
              
              <div className="detail-row" style={{ marginTop: '0.5rem' }}>
                <span className="detail-icon">📧</span>
                <span>{employee.email}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-icon">🏢</span>
                <span>{employee.department}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-icon">🆔</span>
                <span>ID: {employee.employeeId}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="employees-empty">
          <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No Employees Found</h3>
            <p>We couldn't find anyone matching "{searchTerm}". Try adjusting your search criteria.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees; 