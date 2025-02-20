const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Import Models
const Student = require('./models/Student');
const Attendance = require('./models/Attendance');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // ✅ Ensure request body is parsed correctly

// MongoDB Connection
const mongoURI = 'mongodb://localhost:27017/attendance'; // ✅ Use direct MongoDB URL
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection failed:', err));

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "pavanshirsat957@gmail.com", // ✅ Hardcoded email
    pass: "1234", // ❌ CHANGE THIS: Use a secure password (App Password if using Gmail)
  },
});

// Send Email Notification
const sendNotification = async (studentEmail, message) => {
  try {
    const mailOptions = {
      from: "pavanshirsat957@gmail.com",
      to: studentEmail,
      subject: 'Attendance Notification',
      text: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Notification sent to ${studentEmail}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
  }
};

// ✅ TEST Route
app.get('/api/data', (req, res) => {
  res.json({ message: '📡 API is working' });
});

// ✅ Register Student
app.post('/api/register', async (req, res) => {
  try {
    const { name, encoding } = req.body;
    
    console.log('Incoming Request Data:', req.body); // ✅ Debugging log

    if (!name || !encoding) {
      return res.status(400).json({ error: '⚠️ Name and encoding are required' });
    }

    const student = new Student({ name, encoding });
    await student.save();

    res.status(201).json({ message: '🎓 Student registered successfully', student });
  } catch (error) {
    console.error('❌ Student registration failed:', error.message);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// ✅ Mark Attendance
app.post('/api/attendance', async (req, res) => {
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
    console.error('❌ Attendance marking failed:', error.message);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// ✅ Fetch Attendance Records
app.get('/api/attendance', async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find().populate('studentId', 'name');
    res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error('❌ Failed to fetch attendance:', error.message);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// ✅ Fetch All Students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    console.error('❌ Failed to fetch students:', error.message);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// ✅ Send Notification
app.post('/api/notify', async (req, res) => {
  try {
    const { email, message } = req.body;
    if (!email || !message) {
      return res.status(400).json({ error: '⚠️ Email and message are required' });
    }

    await sendNotification(email, message);
    res.status(200).json({ message: '📧 Notification sent successfully' });
  } catch (error) {
    console.error('❌ Notification sending failed:', error.message);
    res.status(500).json({ error: 'Failed to send notification', details: error.message });
  }
});

// ✅ Error-handling Middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// ✅ Start the Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
