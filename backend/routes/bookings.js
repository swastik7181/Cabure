const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/bookings - Create a booking
router.post('/', authenticate, [
  body('pickup.address').notEmpty().withMessage('Pickup address required'),
  body('dropoff.address').notEmpty().withMessage('Dropoff address required'),
  body('selectedProvider').isIn(['uber', 'ola', 'rapido']).withMessage('Invalid provider'),
  body('vehicleType').notEmpty().withMessage('Vehicle type required'),
  body('fare').isNumeric().withMessage('Fare must be a number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      pickup, dropoff, selectedProvider, vehicleType,
      fare, distance, duration, allFareOptions, savedAmount
    } = req.body;

    const booking = new Booking({
      user: req.user._id,
      pickup,
      dropoff,
      selectedProvider,
      vehicleType,
      fare,
      distance,
      duration,
      allFareOptions: allFareOptions || [],
      savedAmount: savedAmount || 0,
      currency: 'INR',
      status: 'confirmed'
    });

    await booking.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        totalRides: 1,
        totalSaved: savedAmount || 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Booking failed. Please try again.' });
  }
});

// GET /api/bookings - Get user's booking history
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.provider) filter.selectedProvider = req.query.provider;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter)
    ]);

    res.json({
      success: true,
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// GET /api/bookings/:id - Get single booking
router.get('/:id', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch booking.' });
  }
});

// PATCH /api/bookings/:id/cancel - Cancel a booking
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ error: `Cannot cancel a ${booking.status} booking.` });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled.', booking });
  } catch (err) {
    res.status(500).json({ error: 'Cancellation failed.' });
  }
});

// PATCH /api/bookings/:id/rate - Rate a booking
router.patch('/:id/rate', authenticate, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { rating, feedback } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: 'completed' },
      { $set: { rating, feedback } },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or not completed.' });
    }

    res.json({ success: true, message: 'Rating submitted!', booking });
  } catch (err) {
    res.status(500).json({ error: 'Rating failed.' });
  }
});

// GET /api/bookings/stats/summary - User stats
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalSpent: { $sum: '$fare' },
          totalSaved: { $sum: '$savedAmount' },
          totalDistance: { $sum: '$distance' },
          avgFare: { $avg: '$fare' },
          providerCounts: { $push: '$selectedProvider' }
        }
      }
    ]);

    const providerBreakdown = await Booking.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$selectedProvider', count: { $sum: 1 }, total: { $sum: '$fare' } } }
    ]);

    res.json({
      success: true,
      stats: stats[0] || { totalBookings: 0, totalSpent: 0, totalSaved: 0, totalDistance: 0 },
      providerBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

module.exports = router;
