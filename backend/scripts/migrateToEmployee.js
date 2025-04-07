const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Student = require('../models/Student');
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

const migrateData = async () => {
  try {
    console.log('🚀 Starting migration from Student to Employee model...');

    // Get all students
    const students = await Student.find();
    console.log(`📊 Found ${students.length} students to migrate`);

    let successCount = 0;
    let errorCount = 0;

    // Migrate each student to employee
    for (const student of students) {
      try {
        // Check if employee already exists
        const existingEmployee = await Employee.findOne({
          $or: [
            { name: student.name },
            { email: student.email || `${student.name.toLowerCase().replace(/\s+/g, '.')}@company.com` }
          ]
        });

        if (existingEmployee) {
          console.log(`⚠️ Employee already exists for student: ${student.name}`);
          continue;
        }

        // Create new employee
        const employee = new Employee({
          name: student.name,
          email: student.email || `${student.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
          department: 'IT', // Default department
          position: 'Employee', // Default position
          employeeId: `EMP${Date.now()}${Math.floor(Math.random() * 1000)}`, // Generate unique ID
          encoding: student.encoding,
          isActive: true,
          createdAt: student.createdAt || new Date(),
          lastAttendance: student.lastAttendance || null
        });

        await employee.save();
        successCount++;
        console.log(`✅ Migrated student: ${student.name} to employee`);
      } catch (err) {
        errorCount++;
        console.error(`❌ Error migrating student ${student.name}:`, err.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Failed migrations: ${errorCount}`);
    console.log(`📝 Total processed: ${students.length}`);

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the migration
connectDB().then(migrateData); 