import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./Dashboard";
import FaceDetection from "./FaceDetection";
import RegisterFace from "./RegisterFace";
import MarkAttendance from "./MarkAttendance";
import Employees from "./Employees";
import ManageEmployees from "./components/ManageEmployees";
import Reports from "./components/Reports";
import Home from "./components/Home";
import Header from "./components/Header";
import Footer from "./components/Footer";
import "./App.css";

// Configure future flags to remove warnings
const routerOptions = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

// Helper function to check if token is valid and not expired
const isTokenValid = (token) => {
  if (!token || token === "undefined" || token === "null" || token === "") return false;
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return false;
    
    // Replace non-url compatible chars with base64 standard chars
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64 decoding correctly mapping each character
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    
    // Check expiration (payload.exp is in seconds, Date.now() is in ms)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false; // Token has expired
    }
    
    return true; // Token is valid
  } catch (error) {
    console.error("Error decoding token:", error);
    return false; // Token is invalid format
  }
};

function App() {
  // Initialize state synchronously so we don't flash the login page on refresh if a token exists
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("token");
    if (!isTokenValid(token)) {
      // Clean up invalid or expired token
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      return false;
    }
    return true;
  });

  useEffect(() => {
    // We still have this to act as a cleanup/validation pass
    const validateTokenPeriodically = () => {
      const token = localStorage.getItem("token");
      if (!isTokenValid(token)) {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    };

    // Check token immediately on mount
    validateTokenPeriodically();

    // Check token expiration periodically (every 1 minute)
    const interval = setInterval(validateTokenPeriodically, 60000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setIsAuthenticated(false);
  };

  return (
    <Router {...routerOptions}>
      <div className="app-container">
        <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <main className="app-main">
          <Routes>
            <Route 
              path="/" 
              element={<Home isAuthenticated={isAuthenticated} onLogout={handleLogout} />} 
            />
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/register" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" /> : <Register onRegister={handleLogin} />
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
              path="/register-face" 
              element={
                isAuthenticated ? <RegisterFace /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/mark-attendance" 
              element={
                isAuthenticated ? <MarkAttendance /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/employees" 
              element={
                isAuthenticated ? <Employees /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/manage-employees" 
              element={
                isAuthenticated ? <ManageEmployees /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/reports" 
              element={
                isAuthenticated ? <Reports /> : <Navigate to="/login" />
              } 
            />
          </Routes>
        </main>
        <Footer isAuthenticated={isAuthenticated} />
  </div>
    </Router>
  );
}

export default App;
