import  { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/attendance');
      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }
      const data = await response.json();
      setAttendanceData(data);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate attendance counts per student
  const studentAttendanceCounts = attendanceData.reduce((acc, record) => {
    if (record.studentId && record.studentId.name) {
      acc[record.studentId.name] = (acc[record.studentId.name] || 0) + (record.status === 'Present' ? 1 : 0);
    }
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(studentAttendanceCounts),
    datasets: [
      {
        label: 'Attendance Count',
        data: Object.values(studentAttendanceCounts),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Attendance Records',
      },
    },
  };

  if (loading) return <p>Loading attendance data...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!attendanceData.length) return <p>No attendance records found.</p>;

  return (
    <div>
      <h2>Attendance Dashboard</h2>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default Dashboard;
