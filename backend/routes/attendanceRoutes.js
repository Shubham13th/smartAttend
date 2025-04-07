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
    const companyId = req.user.companyId;

    if (!employeeId) {
      return res.status(400).json({ error: '⚠️ Employee ID is required' });
    }

    if (!companyId) {
      return res.status(400).json({ error: '⚠️ Company ID is required' });
    }

    // Find employee and verify they belong to the user's company
    const employee = await Employee.findOne({ 
      _id: employeeId,
      companyId 
    });
    
    if (!employee) {
      return res.status(404).json({ error: '❌ Employee not found or not authorized to mark attendance' });
    }

    // Check if attendance already marked for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      employeeId,
      companyId,
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

    // Create attendance record with companyId
    const attendance = new Attendance({ 
      employeeId,
      companyId 
    });
    
    await attendance.save();

    // Update employee's last attendance timestamp
    employee.lastAttendance = new Date();
    await employee.save();

    console.log(`Attendance marked for ${employee.name} (${employee.employeeId}) in company: ${companyId}`);

    res.status(201).json({ message: '📌 Attendance marked successfully', attendance });
  } catch (error) {
    handleError(res, error, 'Attendance marking failed');
  }
});

// Fetch Today's Attendance Records (Protected)
router.get('/today', verifyToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: '⚠️ Company ID is required' });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceRecords = await Attendance.find({
      companyId,
      date: { $gte: today }
    }).populate('employeeId', 'name email department position');

    console.log(`Fetched ${attendanceRecords.length} attendance records for today in company: ${companyId}`);

    res.status(200).json(attendanceRecords);
  } catch (error) {
    handleError(res, error, 'Failed to fetch today\'s attendance');
  }
});

// Fetch All Attendance Records (Protected)
router.get('/', verifyToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: '⚠️ Company ID is required' });
    }
    
    const attendanceRecords = await Attendance.find({ companyId })
      .populate('employeeId', 'name email department position')
      .sort({ date: -1 });
      
    console.log(`Fetched ${attendanceRecords.length} attendance records for company: ${companyId}`);
    
    res.status(200).json(attendanceRecords);
  } catch (error) {
    handleError(res, error, 'Failed to fetch attendance');
  }
});

module.exports = router; 