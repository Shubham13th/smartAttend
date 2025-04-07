const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const verifyToken = require('../middleware/auth');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Employee routes are working!' });
});

// Error Handler
const handleError = (res, error, message = 'Internal Server Error') => {
  console.error(`❌ ${message}:`, error.message);
  res.status(500).json({ 
    error: message, 
    details: error.message 
  });
};

// Get All Employees with Face Encodings (Protected)
router.get('/with-encodings', verifyToken, async (req, res) => {
  try {
    const employees = await Employee.find()
      .sort({ name: 1 });
    res.status(200).json(employees);
  } catch (error) {
    handleError(res, error, 'Failed to fetch employees with encodings');
  }
});

// Get All Employees (Protected)
router.get('/', verifyToken, async (req, res) => {
  try {
    const employees = await Employee.find()
      .select('-encoding') // Exclude face encoding from response
      .sort({ name: 1 });
    res.status(200).json(employees);
  } catch (error) {
    handleError(res, error, 'Failed to fetch employees');
  }
});

// Register Employee (Protected)
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { name, email, department, position, encoding } = req.body;

    if (!name || !email || !encoding) {
      return res.status(400).json({ error: 'Name, email, and face encoding are required' });
    }

    // Check if employee with same email already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(409).json({ error: 'Employee with this email already exists' });
    }

    // Generate employee ID
    const employeeId = `EMP${Date.now().toString().slice(-6)}`;

    const employee = new Employee({
      name,
      email,
      department: department || 'Unassigned',
      position: position || 'Employee',
      employeeId,
      encoding,
      lastAttendance: null
    });

    await employee.save();

    res.status(201).json({
      message: 'Employee registered successfully',
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        employeeId: employee.employeeId
      }
    });
  } catch (error) {
    handleError(res, error, 'Employee registration failed');
  }
});

// Get Employee by ID (Protected)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select('-encoding'); // Exclude face encoding from response
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(200).json(employee);
  } catch (error) {
    handleError(res, error, 'Failed to fetch employee');
  }
});

// Update Employee (Protected)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, email, department, position } = req.body;
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Update fields if provided
    if (name) employee.name = name;
    if (email) employee.email = email;
    if (department) employee.department = department;
    if (position) employee.position = position;

    await employee.save();
    res.status(200).json({ message: 'Employee updated successfully', employee });
  } catch (error) {
    handleError(res, error, 'Failed to update employee');
  }
});

// Delete Employee (Protected)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    await employee.deleteOne();
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete employee');
  }
});

module.exports = router; 