import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DepartmentStats from './components/DepartmentStats';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    attendanceRate: 0,
    departmentStats: {}
  });
  const [registeredEmployees, setRegisteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchEmployees();
    fetchTodayAttendance();
  }, [navigate]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/employees', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRegisteredEmployees(response.data);
      
      // Initialize department stats
      const departmentStats = {};
      response.data.forEach(emp => {
        const dept = emp.department || 'Unassigned';
        if (!departmentStats[dept]) {
          departmentStats[dept] = { total: 0, present: 0, rate: 0 };
        }
        departmentStats[dept].total++;
      });
      
      setStats(prev => ({ ...prev, departmentStats }));
    } catch (err) {
      setError('Failed to fetch employee data');
      console.error('Error fetching employees:', err);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/attendance/today', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const todayData = response.data;
      const presentCount = todayData.filter(record => record.status === 'present').length;
      const uniqueEmployees = new Set(todayData.map(record => record.employeeId)).size;
      
      // Update department stats with present counts
      const updatedDepartmentStats = { ...stats.departmentStats };
      todayData.forEach(record => {
        const emp = registeredEmployees.find(e => e._id === record.employeeId);
        if (emp) {
          const dept = emp.department || 'Unassigned';
          if (updatedDepartmentStats[dept]) {
            updatedDepartmentStats[dept].present++;
            updatedDepartmentStats[dept].rate = Math.round(
              (updatedDepartmentStats[dept].present / updatedDepartmentStats[dept].total) * 100
            );
          }
        }
      });

      setStats({
        totalEmployees: uniqueEmployees,
        presentToday: presentCount,
        attendanceRate: Math.round((presentCount / uniqueEmployees) * 100) || 0,
        departmentStats: updatedDepartmentStats
      });
    } catch (err) {
      setError('Failed to fetch attendance data');
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Employee Attendance Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Employees</h3>
          <p className="stat-value">{stats.totalEmployees}</p>
        </div>
        <div className="stat-card">
          <h3>Present Today</h3>
          <p className="stat-value">{stats.presentToday}</p>
        </div>
        <div className="stat-card">
          <h3>Attendance Rate</h3>
          <p className="stat-value">{stats.attendanceRate}%</p>
        </div>
      </div>

      <DepartmentStats stats={stats.departmentStats} />

      <div className="action-buttons">
        <button onClick={() => navigate('/face-detection')} className="action-btn">
          Mark Attendance
        </button>
        <button onClick={() => navigate('/manage-employees')} className="action-btn">
          Manage Employees
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
