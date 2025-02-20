import React, { useEffect, useState } from 'react';
import FaceDetection from './FaceDetection';
import Dashboard from './Dashboard';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/data')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        return response.json();
      })
      .then((data) => setData(data.message))
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Attendance System</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {data && <p>{data}</p>}
      <FaceDetection />
      <Dashboard />
    </div>
  );
}

export default App;
