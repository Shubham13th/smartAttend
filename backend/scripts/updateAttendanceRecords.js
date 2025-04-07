const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
};

const updateAttendanceRecords = async () => {
  try {
    console.log('🚀 Starting attendance records update...');

    // Get all attendance records
    const attendanceRecords = await Attendance.find();
    console.log(`📊 Found ${attendanceRecords.length} attendance records to update`);

    let successCount = 0;
    let errorCount = 0;

    // Update each attendance record
    for (const record of attendanceRecords) {
      try {
        // Find the corresponding employee
        const employee = await Employee.findOne({ name: record.studentId });
        
        if (!employee) {
          console.log(`⚠️ No employee found for attendance record: ${record._id}`);
          errorCount++;
          continue;
        }

        // Update the record with the new employee ID
        record.employeeId = employee._id;
        await record.save();
        
        successCount++;
        console.log(`✅ Updated attendance record: ${record._id}`);
      } catch (err) {
        errorCount++;
        console.error(`❌ Error updating attendance record ${record._id}:`, err.message);
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`❌ Failed updates: ${errorCount}`);
    console.log(`📝 Total processed: ${attendanceRecords.length}`);

  } catch (err) {
    console.error('❌ Update failed:', err);
  } finally {
    mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the update
connectDB().then(updateAttendanceRecords); 