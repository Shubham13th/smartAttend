const mongoose = require('mongoose');
require('dotenv').config();

const dropIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance');
    console.log('Connected to MongoDB');

    // Get current indexes
    const indexes = await mongoose.connection.collection('users').indexes();
    console.log('Current indexes before dropping:', indexes);

    try {
      // Drop the username index
      await mongoose.connection.collection('users').dropIndex('username_1');
      console.log('Successfully dropped username index');
    } catch (dropError) {
      if (dropError.code === 26) { // Index not found
        console.log('Username index does not exist, no need to drop');
      } else {
        throw dropError;
      }
    }

    // Verify indexes after dropping
    const updatedIndexes = await mongoose.connection.collection('users').indexes();
    console.log('Current indexes after dropping:', updatedIndexes);

    // Recreate the email index if it doesn't exist
    try {
      await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
      console.log('Successfully created email index');
    } catch (createError) {
      if (createError.code === 85) { // Index already exists
        console.log('Email index already exists');
      } else {
        throw createError;
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

dropIndex(); 