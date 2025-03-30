const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
require('dotenv').config();

// Generate JWT Token
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
};

// Error Handler
const handleError = (res, error, message = 'Internal Server Error') => {
  console.error(`❌ ${message}:`, error);
  res.status(500).json({ 
    error: message, 
    details: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

// Register Route
router.post('/register', async (req, res) => {
  console.log('Registration request received:', req.body);
  const { name, email, password } = req.body;
  
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
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: '⚠️ User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword 
    });

    // Generate token
    const token = generateToken(user._id);

    console.log('User registered successfully:', { userId: user._id, email: user.email });
    res.status(201).json({ 
      message: '🎉 User registered successfully', 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
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
    console.log('User logged in successfully:', { userId: user._id, email: user.email });
    
    res.status(200).json({ 
      message: '✅ Login successful', 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
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
