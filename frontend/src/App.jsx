import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./Dashboard";
import FaceDetection from "./FaceDetection";
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

function App() {
  // Initialize state synchronously so we don't flash the login page on refresh if a token exists
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("token");
    return !!(token && token !== "undefined" && token !== "null" && token !== "");
  });

  useEffect(() => {
    // We still have this to act as a cleanup/validation pass
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null" || token === "") {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
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
