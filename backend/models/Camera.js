const mongoose = require('mongoose');

const CameraSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  active: { type: Boolean, default: true },
  status: { type: String, default: 'normal' }, // can be 'normal', 'fire', etc.
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Camera', CameraSchema);
