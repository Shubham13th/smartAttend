import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from './utils/axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import './Dashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [timePeriod, setTimePeriod] = useState('week'); // 'week', 'month', 'year'
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    attendanceRate: 0,
    totalStudents: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/attendance?period=${timePeriod}`);
        setAttendanceData(response.data);
        calculateStats(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch attendance data');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [navigate, timePeriod]);

  const calculateStats = (data) => {
    if (!data) return;

    const total = data.reduce((acc, day) => acc + day.total, 0);
    const present = data.reduce((acc, day) => acc + day.present, 0);
    const absent = data.reduce((acc, day) => acc + day.absent, 0);

    setStats({
      totalPresent: present,
      totalAbsent: absent,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
      totalStudents: total,
    });
  };

  const chartData = {
    labels: attendanceData?.map(day => day.date) || [],
    datasets: [
      {
        label: 'Present',
        data: attendanceData?.map(day => day.present) || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Absent',
        data: attendanceData?.map(day => day.absent) || [],
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };

  const doughnutData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [stats.totalPresent, stats.totalAbsent],
        backgroundColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Attendance Overview (${timePeriod})`,
      },
    },
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="time-period-toggle">
          <button
            className={timePeriod === 'week' ? 'active' : ''}
            onClick={() => setTimePeriod('week')}
          >
            Week
          </button>
          <button
            className={timePeriod === 'month' ? 'active' : ''}
            onClick={() => setTimePeriod('month')}
          >
            Month
          </button>
          <button
            className={timePeriod === 'year' ? 'active' : ''}
            onClick={() => setTimePeriod('year')}
          >
            Year
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Students</h3>
          <p className="stat-value">{stats.totalStudents}</p>
        </div>
        <div className="stat-card">
          <h3>Present Today</h3>
          <p className="stat-value">{stats.totalPresent}</p>
        </div>
        <div className="stat-card">
          <h3>Absent Today</h3>
          <p className="stat-value">{stats.totalAbsent}</p>
        </div>
        <div className="stat-card">
          <h3>Attendance Rate</h3>
          <p className="stat-value">{stats.attendanceRate}%</p>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h2>Attendance Trend</h2>
          <Line data={chartData} options={chartOptions} />
        </div>
        <div className="chart-card">
          <h2>Attendance Distribution</h2>
          <Doughnut data={doughnutData} options={chartOptions} />
        </div>
      </div>

      <div className="quick-actions">
        <button onClick={() => navigate('/face-detection')} className="action-button">
          Mark Attendance
        </button>
        <button onClick={() => navigate('/students')} className="action-button">
          Manage Students
        </button>
        <button onClick={() => navigate('/reports')} className="action-button">
          Generate Report
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
