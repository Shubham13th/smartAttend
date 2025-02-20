const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Student = require('./models/Student');
const Attendance = require('./models/Attendance');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON request bodies

// MongoDB Connection
const mongoURI = 'mongodb://localhost:27017/attendance'; // Replace with your MongoDB URI
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'shubhamsharmajcc@gmail.com', // Replace with your email
    pass: '11111111', // Replace with your email password
  },
});

const sendNotification = async (studentEmail, message) => {
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: studentEmail,
    subject: 'Attendance Notification',
    text: message,
  };

  await transporter.sendMail(mailOptions);
};

// Routes

// Test Route
app.get('/api/data', (req, res) => {
  res.json({ message: 'This is a JSON response' });
});

// Register Student
app.post('/api/register', async (req, res) => {
  try {
    const { name, encoding } = req.body;

    // Validate input
    if (!name || !encoding) {
      return res.status(400).json({ error: 'Name and encoding are required' });
    }

    // Create a new student
    const student = new Student({ name, encoding });
    await student.save();

    res.status(201).json({ message: 'Student registered successfully', student });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Mark Attendance
app.post('/api/attendance', async (req, res) => {
  try {
    const { studentId } = req.body;

    // Validate input
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // Check if the student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Create a new attendance record
    const attendance = new Attendance({ studentId });
    await attendance.save();

    res.status(201).json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Fetch Attendance Records
app.get('/api/attendance', async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find().populate('studentId', 'name');
    res.status(200).json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Fetch All Students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Send Notification
app.post('/api/notify', async (req, res) => {
  try {
    const { email, message } = req.body;
    await sendNotification(email, message);
    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification', details: error.message });
  }
});

// Error-handling Middleware
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Start the Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});