const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
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
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: '⚠️ Employee ID is required' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: '❌ Employee not found' });
    }

    // Check if attendance already marked for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingAttendance) {
      return res.status(200).json({ 
        message: '✅ Attendance already marked for today',
        attendance: existingAttendance
      });
    }

    const attendance = new Attendance({ employeeId });
    await attendance.save();

    res.status(201).json({ message: '📌 Attendance marked successfully', attendance });
  } catch (error) {
    handleError(res, error, 'Attendance marking failed');
  }
});

// Fetch Today's Attendance Records (Protected)
router.get('/today', verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceRecords = await Attendance.find({
      date: { $gte: today }
    }).populate('employeeId', 'name email department position');

    res.status(200).json(attendanceRecords);
  } catch (error) {
    handleError(res, error, 'Failed to fetch today\'s attendance');
  }
});

// Fetch All Attendance Records (Protected)
router.get('/', verifyToken, async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find()
      .populate('employeeId', 'name email department position')
      .sort({ date: -1 });
    res.status(200).json(attendanceRecords);
  } catch (error) {
    handleError(res, error, 'Failed to fetch attendance');
  }
});

module.exports = router; 