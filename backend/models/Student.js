const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  encoding: { type: Array, required: true }, // Face encoding (array of numbers)
});

module.exports = mongoose.model('Student', studentSchema);