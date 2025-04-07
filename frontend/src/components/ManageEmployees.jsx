import { useState, useEffect } from 'react';
import axios from 'axios';
import './ManageEmployees.css';

const ManageEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    employeeId: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/employees', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEmployees(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      position: employee.position || '',
      employeeId: employee.employeeId || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      await axios.put(`http://localhost:5000/api/employees/${editingEmployee._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update employee');
    }
  };

  const handleDelete = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required');
          return;
        }

        await axios.delete(`http://localhost:5000/api/employees/${employeeId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchEmployees();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete employee');
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return <div className="loading">Loading employees...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="manage-employees">
      <h1>Manage Employees</h1>
      
      <div className="employees-list">
        {employees.length === 0 ? (
          <p className="no-employees">No employees found. Register employees using the Face Detection feature.</p>
        ) : (
          employees.map((employee) => (
            <div key={employee._id} className="employee-card">
              {editingEmployee?._id === employee._id ? (
                <form onSubmit={handleUpdate} className="edit-form">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Name"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    required
                  />
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Department"
                    required
                  />
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="Position"
                  />
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    placeholder="Employee ID"
                    disabled
                  />
                  <div className="button-group">
                    <button type="submit" className="save-button">Save</button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => setEditingEmployee(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="employee-info">
                    <h3>{employee.name}</h3>
                    <p><strong>Email:</strong> {employee.email}</p>
                    <p><strong>Department:</strong> {employee.department}</p>
                    {employee.position && <p><strong>Position:</strong> {employee.position}</p>}
                    {employee.employeeId && <p><strong>ID:</strong> {employee.employeeId}</p>}
                  </div>
                  <div className="button-group">
                    <button
                      className="edit-button"
                      onClick={() => handleEdit(employee)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(employee._id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageEmployees; 