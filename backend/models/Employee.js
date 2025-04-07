const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  department: {
    type: String,
    default: 'Unassigned',
    trim: true
  },
  position: {
    type: String,
    default: 'Employee',
    trim: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  companyId: {
    type: String,
    required: true,
    trim: true
  },
  encoding: {
    type: Array,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastAttendance: {
    type: Date,
    default: null
  }
});

// Add index for faster queries
employeeSchema.index({ name: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ isActive: 1 });
employeeSchema.index({ companyId: 1 });

// Compound unique index for email within a company
employeeSchema.index({ companyId: 1, email: 1 }, { unique: true });

// Compound unique index for employeeId within a company
employeeSchema.index({ companyId: 1, employeeId: 1 }, { unique: true });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee; 