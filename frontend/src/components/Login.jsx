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
      const response = await axios.post('https://smartattend-backend.vercel.app/api/auth/login', {
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
      <div className="glass-panel login-box">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your SmartAttend dashboard</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">Work Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="admin@company.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="glass-input"
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
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