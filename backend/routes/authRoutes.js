const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
require('dotenv').config();

// Generate JWT Token
const generateToken = (userId) => {
  // Check if JWT_SECRET is defined
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined in environment variables');
    // Fallback to a default secret in development only
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using fallback secret - THIS IS INSECURE FOR PRODUCTION');
      const fallbackSecret = 'fallback_jwt_secret_only_for_development';
      return jwt.sign({ id: userId }, fallbackSecret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      });
    } else {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
  }
  
  try {
    return jwt.sign({ id: userId }, jwtSecret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
  } catch (error) {
    console.error('Error generating JWT token:', error);
    throw error;
  }
};

// Error Handler
const handleError = (res, error, message = 'Internal Server Error') => {
  console.error(`❌ ${message}:`, error);
  console.error('Error Stack:', error.stack);
  
  // Additional logging for specific error types
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    console.error('MongoDB Error Code:', error.code);
    console.error('MongoDB Error Message:', error.message);
  }
  
  if (error.name === 'ValidationError') {
    console.error('Validation Error Details:', error.errors);
  }
  
  res.status(500).json({ 
    error: message, 
    details: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

// Register Route
router.post('/register', async (req, res) => {
  console.log('Registration request received:', req.body);
  const { name, email, password, companyId, companyName } = req.body;
  
  try {
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: '⚠️ All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '⚠️ Invalid email format' });
    }

    // Check if user exists
    let userExists;
    try {
      userExists = await User.findOne({ email });
      console.log('Existing user check:', userExists ? 'User found' : 'User not found');
    } catch (findError) {
      console.error('Error checking existing user:', findError);
      throw findError;
    }
    
    if (userExists) {
      return res.status(400).json({ error: '⚠️ User already exists' });
    }

    // Hash password
    let hashedPassword;
    try {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
      console.log('Password hashed successfully');
    } catch (hashError) {
      console.error('Error hashing password:', hashError);
      throw hashError;
    }
    
    // Determine company info
    let userCompanyId = companyId;
    let userCompanyName = companyName;
    
    // If company info not provided, derive from email
    if (!userCompanyId) {
      const domain = email.split('@')[1];
      userCompanyId = domain ? domain.split('.')[0] : 'default';
    }
    
    if (!userCompanyName) {
      userCompanyName = userCompanyId.charAt(0).toUpperCase() + userCompanyId.slice(1);
    }

    // Create user
    let user;
    try {
      user = await User.create({ 
        name, 
        email, 
        password: hashedPassword,
        companyId: userCompanyId,
        companyName: userCompanyName
      });
      console.log('User created successfully:', { userId: user._id, companyId: user.companyId });
    } catch (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    // Generate token
    let token;
    try {
      token = generateToken(user._id);
      console.log('Token generated successfully');
    } catch (tokenError) {
      console.error('Error generating token:', tokenError);
      throw tokenError;
    }

    console.log('User registered successfully:', { userId: user._id, email: user.email, companyId: user.companyId });
    res.status(201).json({ 
      message: '🎉 User registered successfully', 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.companyName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    handleError(res, error, 'Registration failed');
  }
});

// Login Route
router.post('/login', async (req, res) => {
  console.log('Login request received:', { email: req.body.email });
  const { email, password } = req.body;
  
  try {
    if (!email || !password) {
      return res.status(400).json({ error: '⚠️ Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: '⚠️ Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: '⚠️ Invalid credentials' });
    }

    const token = generateToken(user._id);
    console.log('User logged in successfully:', { userId: user._id, email: user.email, companyId: user.companyId });
    
    res.status(200).json({ 
      message: '✅ Login successful', 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.companyName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    handleError(res, error, 'Login failed');
  }
});

// Protected Route Example
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: '⚠️ User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    handleError(res, error, 'Profile fetch failed');
  }
});

module.exports = router;
