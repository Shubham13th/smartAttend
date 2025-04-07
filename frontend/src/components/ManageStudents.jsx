import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import './ManageStudents.css';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/students');
      setStudents(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      department: student.department
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/students/${editingStudent._id}`, formData);
      setEditingStudent(null);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update student');
    }
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await axios.delete(`/students/${studentId}`);
        fetchStudents();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete student');
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
    return <div className="loading">Loading students...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="manage-students">
      <h1>Manage Students</h1>
      
      <div className="students-list">
        {students.map((student) => (
          <div key={student._id} className="student-card">
            {editingStudent?._id === student._id ? (
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
                <div className="button-group">
                  <button type="submit" className="save-button">Save</button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setEditingStudent(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="student-info">
                  <h3>{student.name}</h3>
                  <p>{student.email}</p>
                  <p>{student.department}</p>
                </div>
                <div className="button-group">
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(student)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(student._id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageStudents; 