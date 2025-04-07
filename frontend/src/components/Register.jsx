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

      const response = await axios.post('http://localhost:5000/api/auth/register', {
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
      <div className="register-card">
        <h2>Create Company Account</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="company-section">
            <h3>Company Information</h3>
            <div className="form-group">
              <label htmlFor="companyName">Company Name*</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter your company name"
              />
              <small className="form-helper">This will be used to identify your company in the system</small>
            </div>
          </div>

          <div className="admin-section">
            <h3>Admin Information</h3>
            <div className="form-group">
              <label htmlFor="name">Full Name*</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter your email address"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password*</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Create a password"
                minLength="6"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password*</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Confirm your password"
                minLength="6"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="register-button">
            {loading ? 'Creating Company Account...' : 'Register Company'}
          </button>
        </form>
        <div className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
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