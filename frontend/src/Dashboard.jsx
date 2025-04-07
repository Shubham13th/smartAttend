import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DepartmentStats from './components/DepartmentStats';
import EmptyState from './components/EmptyState';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    attendanceRate: 0,
    departmentStats: {}
  });
  const [companyInfo, setCompanyInfo] = useState({
    companyId: '',
    companyName: '',
    userName: ''
  });
  const [registeredEmployees, setRegisteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Refresh function to update attendance data
  const refreshDashboardData = () => {
    console.log('Refreshing dashboard data...');
    setLastRefresh(Date.now());
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Check if we need to refresh based on localStorage flag
    const dashboardRefresh = localStorage.getItem('dashboardRefresh');
    if (dashboardRefresh) {
      console.log('Dashboard refresh triggered from attendance marking');
      localStorage.removeItem('dashboardRefresh'); // Clear the flag
      setLastRefresh(Date.now());
    }

    // Load user data from localStorage
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        console.log('User data loaded from localStorage:', userData);
        
        if (userData.companyId) {
          setCompanyInfo({
            companyId: userData.companyId,
            companyName: userData.companyName ? userData.companyName.toUpperCase() : userData.companyId.charAt(0).toUpperCase() + userData.companyId.slice(1),
            userName: userData.name || 'User'
          });
        }
      } else {
        console.warn('No user data found in localStorage');
      }
    } catch (err) {
      console.error('Error parsing user data from localStorage:', err);
    }

    fetchEmployees();
    fetchTodayAttendance();

    // Set up an interval to refresh data every minute
    const refreshInterval = setInterval(() => {
      fetchTodayAttendance();
    }, 60000); // 60 seconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, [navigate, lastRefresh]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching employees with token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.get('http://localhost:5000/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Employees API response:', response.data.length, 'employees');
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
      
      setStats(prev => ({ ...prev, totalEmployees: response.data.length, departmentStats }));
    } catch (err) {
      console.error('Error fetching employees:', err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to fetch employee data: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/attendance/today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Attendance API response:', response.data.length, 'attendance records');
      const todayData = response.data;
      
      // Handle case when no employees are present
      if (!registeredEmployees.length) {
        setStats(prev => ({
          ...prev,
          presentToday: 0,
          attendanceRate: 0
        }));
        setLoading(false);
        return;
      }
      
      // Count unique employees present (using Set to ensure each employee is counted only once)
      const uniqueEmployeeIds = new Set();
      todayData.forEach(record => {
        if (record.employeeId && record.employeeId._id) {
          uniqueEmployeeIds.add(record.employeeId._id);
        }
      });
      let presentCount = uniqueEmployeeIds.size;
      
      console.log(`Unique employees present today: ${presentCount}`);
      
      // Update department stats with present counts
      const updatedDepartmentStats = { ...stats.departmentStats };
      // Reset all present counts first to avoid double counting
      Object.keys(updatedDepartmentStats).forEach(dept => {
        updatedDepartmentStats[dept].present = 0;
      });
      
      // Count unique employees by department
      const departmentCounts = {};
      todayData.forEach(record => {
        if (record.employeeId && record.employeeId.department) {
          const dept = record.employeeId.department || 'Unassigned';
          const empId = record.employeeId._id;
          
          if (!departmentCounts[dept]) {
            departmentCounts[dept] = new Set();
          }
          departmentCounts[dept].add(empId);
        }
      });
      
      // Update department stats based on unique counts
      Object.keys(departmentCounts).forEach(dept => {
        if (updatedDepartmentStats[dept]) {
          updatedDepartmentStats[dept].present = departmentCounts[dept].size;
          
          // Ensure present count doesn't exceed total
          if (updatedDepartmentStats[dept].present > updatedDepartmentStats[dept].total) {
            updatedDepartmentStats[dept].present = updatedDepartmentStats[dept].total;
          }
          
          updatedDepartmentStats[dept].rate = Math.round(
            (updatedDepartmentStats[dept].present / updatedDepartmentStats[dept].total) * 100
          );
        }
      });

      const totalEmployees = registeredEmployees.length;
      
      // Ensure present count doesn't exceed total employees
      if (presentCount > totalEmployees) {
        presentCount = totalEmployees;
      }
      
      setStats(prev => ({
        ...prev,
        totalEmployees,
        presentToday: presentCount,
        attendanceRate: totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0,
        departmentStats: updatedDepartmentStats
      }));
    } catch (err) {
      console.error('Error fetching attendance:', err);
      if (err.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to fetch attendance data: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  // Show empty state if no employees are registered
  if (stats.totalEmployees === 0) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-info">
            <h1>Employee Attendance Dashboard</h1>
            {companyInfo.companyName && (
              <h2 className="company-name">Company: {companyInfo.companyName}</h2>
            )}
          </div>
          <div className="header-actions">
            <button onClick={refreshDashboardData} className="refresh-btn" title="Refresh Dashboard">
              Refresh
            </button>
          </div>
        </header>
        <EmptyState companyName={companyInfo.companyName} />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-info">
          <h1>Employee Attendance Dashboard</h1>
          {companyInfo.companyName && (
            <h2 className="company-name">Company: {companyInfo.companyName}</h2>
          )}
        </div>
        <div className="header-actions">
          <button onClick={refreshDashboardData} className="refresh-btn" title="Refresh Dashboard">
            Refresh
          </button>
        </div>
      </header>

      <div className="welcome-banner">
        <p>Welcome, {companyInfo.userName || 'User'}! Here&apos;s your company attendance overview.</p>
      </div>

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
