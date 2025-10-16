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

      const response = await axios.get('https://smartattend-backend.onrender.com/api/employees', {
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading employees...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.href = '/login'}>
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="employees-container">
      <div className="employees-header">
        <h1>Employee Management</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="employees-grid">
        {filteredEmployees.map((employee) => (
          <div key={employee._id} className="employee-card">
            <div className="employee-info">
              <h3>{employee.name}</h3>
              <p className="employee-email">{employee.email}</p>
              <p className="employee-department">{employee.department}</p>
              <p className="employee-position">{employee.position}</p>
              <p className="employee-id">ID: {employee.employeeId}</p>
            </div>
            <div className="employee-status">
              <span className={`status-badge ${employee.isActive ? 'active' : 'inactive'}`}>
                {employee.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="no-results">
          <p>No employees found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Employees; 