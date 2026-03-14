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

      const response = await axios.get('https://smartattend-backend.vercel.app/api/employees', {
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

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    employeeId: ''
  });

  const handleEdit = (employee) => {
    setEditingId(employee._id);
    setEditForm({
      name: employee.name || '',
      email: employee.email || '',
      department: employee.department || '',
      position: employee.position || '',
      employeeId: employee.employeeId || ''
    });
  };

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async (employeeId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      await axios.put(`https://smartattend-backend.vercel.app/api/employees/${employeeId}`, editForm, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEditingId(null);
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

        await axios.delete(`https://smartattend-backend.vercel.app/api/employees/${employeeId}`, {
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

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({
      name: '',
      email: '',
      department: '',
      position: '',
      employeeId: ''
    });
  };

  if (loading) return <div className="manage-employees-container loading">Loading employees...</div>;
  if (error) return <div className="manage-employees-container error">{error}</div>;

  return (
    <div className="manage-employees-container">
      <div className="manage-header">
        <h1 className="manage-title">Manage Employees</h1>
        <p className="manage-subtitle">Edit or remove team members from your workspace</p>
      </div>
      
      <div className="employees-list">
        {employees.length === 0 ? (
          <div className="glass-card no-employees">
            No employees found.
          </div>
        ) : (
          employees.map((employee) => (
            <div key={employee._id} className="glass-card manage-card">
              {editingId === employee._id ? (
                // Edit Mode
                <div className="edit-form">
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    className="edit-input"
                  />
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                    placeholder="Email Address"
                    className="edit-input"
                  />
                  <input
                    type="text"
                    name="department"
                    value={editForm.department}
                    onChange={handleInputChange}
                    placeholder="Department"
                    className="edit-input"
                  />
                  <input
                    type="text"
                    name="position"
                    value={editForm.position}
                    onChange={handleInputChange}
                    placeholder="Position/Role"
                    className="edit-input"
                  />
                  <div className="button-group">
                    <button onClick={() => handleSave(employee._id)} className="save-button" title="Save">
                      Save
                    </button>
                    <button onClick={handleCancel} className="cancel-button" title="Cancel">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="employee-info">
                    <h3>{employee.name}</h3>
                    <p><strong>Email:</strong> {employee.email}</p>
                    <p><strong>Department:</strong> {employee.department || 'Unassigned'}</p>
                    <p><strong>Position:</strong> {employee.position || 'Employee'}</p>
                    <p><strong>Employee ID:</strong> {employee.employeeId}</p>
                  </div>
                  <div className="button-group">
                    <button onClick={() => handleEdit(employee)} className="edit-button" title="Edit Employee">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(employee._id)} className="delete-button" title="Delete Employee">
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