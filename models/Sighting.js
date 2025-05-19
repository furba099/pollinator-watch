const mongoose = require('mongoose');

const SightingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: String,
  image: {
    filename: String,
    mimetype: String,
    size: Number
  },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sighting', SightingSchema);
