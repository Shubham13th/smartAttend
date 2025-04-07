import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
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
import './Reports.css';

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

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [reportType, setReportType] = useState('daily'); // daily, weekly, monthly
  const [department, setDepartment] = useState('all');

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/reports', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          type: reportType,
          department
        }
      });

      setReportData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await axios.get('/reports/download', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          type: reportType,
          department
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download report');
    }
  };

  const chartData = reportData ? {
    labels: reportData.dates,
    datasets: [
      {
        label: 'Present',
        data: reportData.present,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Absent',
        data: reportData.absent,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  } : null;

  const doughnutData = reportData ? {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [reportData.totalPresent, reportData.totalAbsent],
        backgroundColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'],
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Attendance Overview',
      },
    },
  };

  return (
    <div className="reports-container">
      <h1>Generate Attendance Report</h1>

      <div className="report-filters">
        <div className="filter-group">
          <label>Date Range:</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>

        <div className="filter-group">
          <label>Report Type:</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Department:</label>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="all">All Departments</option>
            <option value="computer">Computer Science</option>
            <option value="mechanical">Mechanical</option>
            <option value="electrical">Electrical</option>
            <option value="civil">Civil</option>
          </select>
        </div>

        <button 
          className="generate-button"
          onClick={generateReport}
          disabled={loading || !dateRange.startDate || !dateRange.endDate}
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {reportData && (
        <div className="report-content">
          <div className="report-summary">
            <div className="summary-card">
              <h3>Total Students</h3>
              <p>{reportData.totalStudents}</p>
            </div>
            <div className="summary-card">
              <h3>Present</h3>
              <p>{reportData.totalPresent}</p>
            </div>
            <div className="summary-card">
              <h3>Absent</h3>
              <p>{reportData.totalAbsent}</p>
            </div>
            <div className="summary-card">
              <h3>Attendance Rate</h3>
              <p>{reportData.attendanceRate}%</p>
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

          <div className="report-actions">
            <button className="download-button" onClick={downloadReport}>
              Download Report (PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports; 