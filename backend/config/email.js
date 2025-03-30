const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendNotification = async (studentEmail, message) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: 'Attendance Notification',
      text: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Notification sent to ${studentEmail}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }
};

module.exports = { sendNotification }; 