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
    const companyId = req.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }
    
    console.log(`Fetching employees with encodings for company: ${companyId}`);
    
    const employees = await Employee.find({ companyId })
      .sort({ name: 1 });
      
    console.log(`Found ${employees.length} employees with encodings for company: ${companyId}`);
    
    res.status(200).json(employees);
  } catch (error) {
    handleError(res, error, 'Failed to fetch employees with encodings');
  }
});

// Get All Employees (Protected)
router.get('/', verifyToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }
    
    console.log(`Fetching employees for company: ${companyId}`);
    
    const employees = await Employee.find({ companyId })
      .select('-encoding') // Exclude face encoding from response
      .sort({ name: 1 });
      
    console.log(`Found ${employees.length} employees for company: ${companyId}`);
    
    res.status(200).json(employees);
  } catch (error) {
    handleError(res, error, 'Failed to fetch employees');
  }
});

// Register Employee (Protected)
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { name, email, department, position, encoding } = req.body;
    const companyId = req.user.companyId;

    if (!name || !email || !encoding) {
      return res.status(400).json({ error: 'Name, email, and face encoding are required' });
    }

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Check if employee with same email already exists in this company
    const existingEmployee = await Employee.findOne({ email, companyId });
    if (existingEmployee) {
      return res.status(409).json({ error: 'Employee with this email already exists in your company' });
    }

    // Generate employee ID with company prefix
    const companyPrefix = companyId.substring(0, 3).toUpperCase();
    const employeeId = `${companyPrefix}${Date.now().toString().slice(-6)}`;

    const employee = new Employee({
      name,
      email,
      department: department || 'Unassigned',
      position: position || 'Employee',
      employeeId,
      companyId,
      encoding,
      lastAttendance: null
    });

    // Try saving — if it fails due to stale global email_1 index, drop it and retry once
    try {
      await employee.save();
    } catch (saveError) {
      // code 11000 = MongoDB duplicate key error
      if (saveError.code === 11000 && saveError.message.includes('email_1')) {
        console.log('Stale global email_1 index detected — dropping it and retrying...');
        try {
          await require('mongoose').connection.collection('employees').dropIndex('email_1');
          console.log('✅ Dropped stale email_1 index');
        } catch (dropErr) {
          console.log('Could not drop index (may not exist):', dropErr.message);
        }
        // Retry the save
        await employee.save();
      } else {
        throw saveError; // Re-throw other errors
      }
    }

    console.log(`Employee ${name} (${employeeId}) registered for company: ${companyId}`);

    res.status(201).json({
      message: 'Employee registered successfully',
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        employeeId: employee.employeeId,
        companyId: employee.companyId
      }
    });
  } catch (error) {
    handleError(res, error, 'Employee registration failed');
  }
});

// Get Employee by ID (Protected)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    const employee = await Employee.findOne({
      _id: req.params.id,
      companyId // Ensure employee belongs to user's company
    }).select('-encoding'); // Exclude face encoding from response
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found or not authorized to access' });
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
    const companyId = req.user.companyId;
    
    const employee = await Employee.findOne({
      _id: req.params.id,
      companyId // Ensure employee belongs to user's company
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found or not authorized to update' });
    }

    // Update fields if provided
    if (name) employee.name = name;
    if (email) employee.email = email;
    if (department) employee.department = department;
    if (position) employee.position = position;

    await employee.save();
    
    console.log(`Employee ${employee.name} (${employee.employeeId}) updated for company: ${companyId}`);
    
    res.status(200).json({ message: 'Employee updated successfully', employee });
  } catch (error) {
    handleError(res, error, 'Failed to update employee');
  }
});

// Delete Employee (Protected)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    const employee = await Employee.findOne({
      _id: req.params.id,
      companyId // Ensure employee belongs to user's company
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found or not authorized to delete' });
    }
    
    await employee.deleteOne();
    
    console.log(`Employee ${employee.name} (${employee.employeeId}) deleted from company: ${companyId}`);
    
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete employee');
  }
});

module.exports = router; 