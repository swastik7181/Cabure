const mongoose = require('mongoose');

const fareOptionSchema = new mongoose.Schema({
  provider: String,
  vehicleType: String,
  estimatedFare: Number,
  estimatedTime: Number,
  surgeMultiplier: Number,
  currency: { type: String, default: 'INR' }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pickup: {
    address: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number }
  },
  dropoff: {
    address: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number }
  },
  selectedProvider: {
    type: String,
    required: true,
    enum: ['uber', 'ola', 'rapido']
  },
  vehicleType: {
    type: String,
    required: true
  },
  fare: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  distance: {
    type: Number // in km
  },
  duration: {
    type: Number // in minutes
  },
  allFareOptions: [fareOptionSchema],
  savedAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
    default: 'confirmed'
  },
  bookingReference: {
    type: String,
    unique: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String
}, { timestamps: true });

// Generate booking reference before saving
bookingSchema.pre('save', function (next) {
  if (!this.bookingReference) {
    const prefix = 'CAB';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.bookingReference = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
