import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./Dashboard";
import FaceDetection from "./FaceDetection";
import Employees from "./Employees";
import Home from "./Home";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("token");
    return !!token;
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/face-detection" 
          element={
            isAuthenticated ? <FaceDetection /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/employees" 
          element={
            isAuthenticated ? <Employees /> : <Navigate to="/login" />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
