const mongoose = require('mongoose');

const SightingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    image: String,
    location: String,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sighting', SightingSchema);
