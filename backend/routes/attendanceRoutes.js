const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const verifyToken = require('../middleware/auth');

// Error Handler
const handleError = (res, error, message = 'Internal Server Error') => {
  console.error(`❌ ${message}:`, error.message);
  res.status(500).json({ 
    error: message, 
    details: error.message 
  });
};

// Mark Attendance (Protected)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: '⚠️ Student ID is required' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: '❌ Student not found' });
    }

    const attendance = new Attendance({ studentId });
    await attendance.save();

    res.status(201).json({ message: '📌 Attendance marked successfully', attendance });
  } catch (error) {
    handleError(res, error, 'Attendance marking failed');
  }
});

// Fetch Attendance Records (Protected)
router.get('/', verifyToken, async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find().populate('studentId', 'name');
    res.status(200).json(attendanceRecords);
  } catch (error) {
    handleError(res, error, 'Failed to fetch attendance');
  }
});

module.exports = router; 