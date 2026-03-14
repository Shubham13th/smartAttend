import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
import './Register.css';

const Register = ({ onRegister }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyRole: 'admin' // Default role when creating a company
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.companyName.trim()) {
      setError('Company name is required');
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting registration data:', {
        name: formData.name,
        email: formData.email,
        companyName: formData.companyName,
        password: '********' // Don't log actual password
      });

      // Generate a unique companyId from company name
      const companyId = formData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now().toString(36);

      const response = await axios.post('https://smartattend-backend.vercel.app/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        companyId: companyId,
        role: formData.companyRole
      });

      console.log('Registration successful:', response.data);

      // Store token in localStorage
      localStorage.setItem('token', response.data.token);

      // Store user data in localStorage
      if (response.data.user) {
        // Ensure company data is included
        const userData = {
          ...response.data.user,
          companyId: companyId,
          companyName: formData.companyName
        };

        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('User data stored in localStorage:', userData);
      }

      if (onRegister) {
        onRegister();
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });

      // More specific error messages based on response
      if (err.response?.status === 500) {
        setError('Server error occurred. Please try again later or contact support.');
      } else if (err.response?.status === 400) {
        setError(err.response.data?.error || 'Invalid registration data. Please check your information.');
      } else if (err.response?.status === 409) {
        setError('This email is already registered. Please use a different email or login.');
      } else if (!err.response) {
        setError('Cannot connect to server. Please check your internet connection.');
      } else {
        setError(err.response?.data?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="glass-panel register-box">
        <div className="register-header">
          <h2>Register Company</h2>
          <p>Create a SmartAttend workspace for your team</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          
          <div className="input-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              id="companyName"
              type="text"
              name="companyName"
              placeholder="Acme Corp"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="glass-input"
            />
          </div>

          <div className="form-row">
            <div className="input-group">
              <label htmlFor="name">Admin Name</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={handleChange}
                required
                className="glass-input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">Admin Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="jane@acme.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="glass-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="glass-input"
                autoComplete="new-password"
              />
              <div className="password-strength">
                Strength: {passwordStrength}
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="glass-input"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register Company'}
          </button>
        </form>

        <div className="register-footer">
          Already have an account? 
          <a href="/login">Sign In</a>
        </div>
      </div>
    </div>
  );
};

Register.propTypes = {
  onRegister: PropTypes.func
};

Register.defaultProps = {
  onRegister: null
};

export default Register; 