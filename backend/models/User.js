const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  companyId: {
    type: String,
    required: [true, 'Company ID is required'],
    trim: true,
    index: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  role: { 
    type: String, 
    enum: {
      values: ['admin', 'manager', 'employee'],
      message: '{VALUE} is not a valid role'
    },
    default: 'admin' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
  collection: 'users' // Explicitly name the collection
});

// Add an index on the email field to ensure uniqueness
userSchema.index({ email: 1 }, { unique: true });

// Compound index on companyId and email to allow same email in different companies
userSchema.index({ companyId: 1, email: 1 });

// Pre-save hook for any additional processing
userSchema.pre('save', function(next) {
  // You can add additional logic here if needed
  next();
});

module.exports = mongoose.model('User', userSchema);