const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const verifyToken = require('./middleware/auth');
require('dotenv').config();
// Import Models
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');
const User = require('./models/User');
// Import Routes
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // ✅ Ensure request body is parsed correctly

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// MongoDB Connection with retry logic
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'URI is defined' : 'URI is NOT defined');

    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB Connected:', conn.connection.host);
    console.log('Database Name:', conn.connection.name);

    // Test User model
    try {
      const count = await User.estimatedDocumentCount();
      console.log(`✅ User model is working. Found ${count} users.`);

      // Validate indexes - important for unique constraints
      const indexes = await User.collection.indexes();
      console.log('User collection indexes:', JSON.stringify(indexes));
    } catch (err) {
      console.error('❌ User model error:', err);
      console.error('Error Stack:', err.stack);
      throw err;
    }
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    console.error('Error Stack:', err.stack);

    if (err.name === 'MongoParseError') {
      console.error('Check your MongoDB connection string - it appears to be malformed');
    } else if (err.name === 'MongoServerSelectionError') {
      console.error('Could not connect to MongoDB server. Make sure MongoDB is running.');
    }

    // Retry connection after 5 seconds
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// Fix database indexes
const fixUserIndexes = async () => {
  try {
    console.log('Checking for problematic indexes...');
    const db = mongoose.connection;

    // Wait for MongoDB connection
    if (db.readyState !== 1) {
      await new Promise(resolve => {
        db.once('open', resolve);
      });
    }

    // Drop the problematic username index
    try {
      await db.collection('users').dropIndex('username_1');
      console.log('✅ Successfully dropped problematic username index');
    } catch (err) {
      // Ignore if index doesn't exist
      console.log('Note: username_1 index not found or already dropped');
    }

    console.log('Database indexes check completed');
  } catch (error) {
    console.error('Error fixing indexes:', error);
  }
};

connectDB()
  .then(() => fixUserIndexes())
  .catch(err => console.error('Failed to initialize:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.get('/api/secure-data', verifyToken, (req, res) => {
  res.json({ message: '🔒 This is secure data', user: req.user });
});

// Send Email Notification
const sendNotification = async (employeeEmail, message) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: employeeEmail,
      subject: 'Attendance Notification',
      text: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Notification sent to ${employeeEmail}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
  }
};

// Test Route
app.get('/api/data', (req, res) => {
  res.json({ message: '📡 API is working' });
});

// End of API routes

// Error-handling Middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start the Server (only in local dev — Vercel handles this in production)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
}

// ✅ Export app for Vercel serverless
module.exports = app;