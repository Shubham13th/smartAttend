import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
import './Login.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('https://smartattend-backend.onrender.com/api/auth/login', {
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName
      });
      
      console.log('Login successful:', response.data);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      
      // Store user data in localStorage
      if (response.data.user) {
        const userData = response.data.user;
        
        // If company name was provided but no companyId exists, create one
        if (formData.companyName && !userData.companyId) {
          const companyId = formData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now().toString(36);
          userData.companyId = companyId;
          userData.companyName = formData.companyName;
          
          console.log('Created company info:', {
            companyId: userData.companyId,
            companyName: userData.companyName
          });
        }
        // Otherwise derive from email domain as fallback
        else if (!userData.companyId) {
          const emailDomain = formData.email.split('@')[1];
          const domainName = emailDomain ? emailDomain.split('.')[0] : 'default';
          userData.companyId = domainName;
          userData.companyName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
          
          console.log('Derived company info from email:', {
            companyId: userData.companyId,
            companyName: userData.companyName
          });
        }
        
        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('User data stored in localStorage:', userData);
      }
      
      onLogin();
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login to SmartAttend</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter your company name (optional)"
            />
            <small className="form-helper">Provide your company name to access your company data</small>
          </div>
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="auth-link">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

Login.propTypes = {
  onLogin: PropTypes.func.isRequired
};

export default Login; 