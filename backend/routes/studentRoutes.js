const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const verifyToken = require('../middleware/auth');

// Error Handler
const handleError = (res, error, message = 'Internal Server Error') => {
  console.error(`❌ ${message}:`, error.message);
  res.status(500).json({ 
    error: message, 
    details: error.message 
  });
};

// Register Student (Protected)
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { name, encoding } = req.body;
    
    if (!name || !encoding) {
      return res.status(400).json({ error: '⚠️ Name and encoding are required' });
    }

    const student = new Student({ name, encoding });
    await student.save();

    res.status(201).json({ message: '🎓 Student registered successfully', student });
  } catch (error) {
    handleError(res, error, 'Student registration failed');
  }
});

// Fetch All Students (Protected)
router.get('/', verifyToken, async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    handleError(res, error, 'Failed to fetch students');
  }
});

module.exports = router; 