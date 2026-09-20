const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// Simulated Provider API Integrations
// In production, replace these with real API calls to:
// Uber: https://developer.uber.com/docs/riders/references/api
// Ola:  https://developer.olacabs.com/
// Rapido: https://developer.rapido.bike/
// ─────────────────────────────────────────────────────────────

const PROVIDERS = {
  uber: {
    name: 'Uber',
    color: '#000000',
    logo: 'U',
    vehicles: ['UberGo', 'Uber Premier', 'UberXL', 'UberAuto'],
    baseRates: { 'UberGo': 12, 'Uber Premier': 18, 'UberXL': 22, 'UberAuto': 8 },
    perKmRates: { 'UberGo': 11, 'Uber Premier': 16, 'UberXL': 18, 'UberAuto': 6 },
    perMinRates: { 'UberGo': 1.5, 'Uber Premier': 2, 'UberXL': 2, 'UberAuto': 0.8 },
    availability: 0.95
  },
  ola: {
    name: 'Ola',
    color: '#3CB371',
    logo: 'O',
    vehicles: ['Ola Mini', 'Ola Prime', 'Ola SUV', 'Ola Auto'],
    baseRates: { 'Ola Mini': 10, 'Ola Prime': 16, 'Ola SUV': 20, 'Ola Auto': 7 },
    perKmRates: { 'Ola Mini': 10, 'Ola Prime': 15, 'Ola SUV': 17, 'Ola Auto': 5 },
    perMinRates: { 'Ola Mini': 1.2, 'Ola Prime': 1.8, 'Ola SUV': 2, 'Ola Auto': 0.7 },
    availability: 0.90
  },
  rapido: {
    name: 'Rapido',
    color: '#FFD700',
    logo: 'R',
    vehicles: ['Bike', 'Auto', 'Rapido Cab'],
    baseRates: { 'Bike': 5, 'Auto': 7, 'Rapido Cab': 12 },
    perKmRates: { 'Bike': 4, 'Auto': 5, 'Rapido Cab': 9 },
    perMinRates: { 'Bike': 0.5, 'Auto': 0.7, 'Rapido Cab': 1.2 },
    availability: 0.85
  }
};

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Simulate surge pricing based on time of day and randomness
const getSurgeMultiplier = () => {
  const hour = new Date().getHours();
  const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 21);
  const baseMultiplier = isPeakHour ? 1.5 : 1.0;
  const variance = (Math.random() - 0.5) * 0.4;
  return Math.max(1.0, parseFloat((baseMultiplier + variance).toFixed(2)));
};

// Simulate estimated time to arrival
const getETA = (distance) => {
  const avgSpeedKmH = 25 + Math.random() * 20;
  const timeHours = distance / avgSpeedKmH;
  return Math.ceil(timeHours * 60) + Math.floor(Math.random() * 5);
};

// Simulate provider API call
const fetchProviderFares = async (providerKey, pickup, dropoff, distance, duration) => {
  const provider = PROVIDERS[providerKey];

  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));

  // Simulate occasional unavailability
  if (Math.random() > provider.availability) {
    return [];
  }

  const surge = getSurgeMultiplier();
  const fares = [];

  for (const vehicle of provider.vehicles) {
    const baseFare = provider.baseRates[vehicle] || 10;
    const perKm = provider.perKmRates[vehicle] || 10;
    const perMin = provider.perMinRates[vehicle] || 1;

    const rawFare = baseFare + (distance * perKm) + (duration * perMin);
    const surgedFare = rawFare * surge;
    const variance = 1 + (Math.random() - 0.5) * 0.1;
    const finalFare = Math.ceil(surgedFare * variance);

    fares.push({
      provider: providerKey,
      providerName: provider.name,
      providerColor: provider.color,
      vehicleType: vehicle,
      estimatedFare: finalFare,
      estimatedTime: getETA(distance),
      tripDuration: Math.ceil(duration),
      surgeMultiplier: surge,
      currency: 'INR',
      distance: parseFloat(distance.toFixed(2)),
      breakdown: {
        baseFare,
        distanceCharge: parseFloat((distance * perKm).toFixed(2)),
        timeCharge: parseFloat((duration * perMin).toFixed(2)),
        surgeCharge: parseFloat(((surgedFare - rawFare)).toFixed(2))
      }
    });
  }

  return fares;
};

// ─────────────────────────────────────────────────────────────
// GET /api/fares/compare
// Query: pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, pickup_address, dropoff_address
// ─────────────────────────────────────────────────────────────
router.get('/compare', authenticate, async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, pickup_address, dropoff_address } = req.query;

    if (!pickup_lat || !pickup_lng || !dropoff_lat || !dropoff_lng) {
      return res.status(400).json({ error: 'Pickup and dropoff coordinates required.' });
    }

    const lat1 = parseFloat(pickup_lat);
    const lon1 = parseFloat(pickup_lng);
    const lat2 = parseFloat(dropoff_lat);
    const lon2 = parseFloat(dropoff_lng);

    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    const avgSpeedKmH = 25;
    const duration = (distance / avgSpeedKmH) * 60; // in minutes

    // Fetch fares from all providers in parallel
    const [uberFares, olaFares, rapidoFares] = await Promise.all([
      fetchProviderFares('uber', { lat: lat1, lng: lon1, address: pickup_address }, { lat: lat2, lng: lon2, address: dropoff_address }, distance, duration),
      fetchProviderFares('ola', { lat: lat1, lng: lon1, address: pickup_address }, { lat: lat2, lng: lon2, address: dropoff_address }, distance, duration),
      fetchProviderFares('rapido', { lat: lat1, lng: lon1, address: pickup_address }, { lat: lat2, lng: lon2, address: dropoff_address }, distance, duration)
    ]);

    const allFares = [...uberFares, ...olaFares, ...rapidoFares];

    if (allFares.length === 0) {
      return res.status(503).json({ error: 'No providers available at this time. Please try again.' });
    }

    // Sort by fare (cheapest first)
    allFares.sort((a, b) => a.estimatedFare - b.estimatedFare);

    const cheapest = allFares[0];
    const mostExpensive = allFares[allFares.length - 1];
    const savings = mostExpensive.estimatedFare - cheapest.estimatedFare;

    // Group by provider
    const byProvider = {};
    for (const fare of allFares) {
      if (!byProvider[fare.provider]) byProvider[fare.provider] = [];
      byProvider[fare.provider].push(fare);
    }

    res.json({
      success: true,
      pickup: { address: pickup_address, lat: lat1, lng: lon1 },
      dropoff: { address: dropoff_address, lat: lat2, lng: lon2 },
      distance: parseFloat(distance.toFixed(2)),
      estimatedDuration: Math.ceil(duration),
      fares: allFares,
      byProvider,
      recommendation: {
        best: cheapest,
        savings: parseFloat(savings.toFixed(2)),
        savingsPercent: parseFloat(((savings / mostExpensive.estimatedFare) * 100).toFixed(1))
      },
      fetchedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('Fare comparison error:', err);
    res.status(500).json({ error: 'Failed to fetch fares. Please try again.' });
  }
});

// GET /api/fares/providers - list all providers
router.get('/providers', (req, res) => {
  const providers = Object.entries(PROVIDERS).map(([key, p]) => ({
    id: key,
    name: p.name,
    color: p.color,
    vehicles: p.vehicles,
    availability: p.availability
  }));
  res.json({ providers });
});

module.exports = router;
