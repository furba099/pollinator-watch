const mongoose = require('mongoose');

const SightingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sighting', SightingSchema);
