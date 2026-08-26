import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, MapPin, Navigation, TrendingDown, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import FareCard from '../components/FareCard';

// Indian city coordinates for demo
const CITY_COORDS = {
  'Connaught Place, Delhi': { lat: 28.6315, lng: 77.2167 },
  'Cyber Hub, Gurugram': { lat: 28.4943, lng: 77.0889 },
  'Bandra, Mumbai': { lat: 19.0596, lng: 72.8295 },
  'Koramangala, Bangalore': { lat: 12.9352, lng: 77.6245 },
  'T Nagar, Chennai': { lat: 13.0418, lng: 80.2341 },
  'Salt Lake, Kolkata': { lat: 22.5726, lng: 88.4142 },
  'Andheri, Mumbai': { lat: 19.1136, lng: 72.8697 },
  'Indiranagar, Bangalore': { lat: 12.9784, lng: 77.6408 },
  'Hitech City, Hyderabad': { lat: 17.4474, lng: 78.3762 },
  'Sector 62, Noida': { lat: 28.6262, lng: 77.3722 },
  'IIT Kanpur, Kanpur': { lat: 26.5123, lng: 80.2329 },
  'Kanpur Central, Kanpur': { lat: 26.4499, lng: 80.3319 },
  'Civil Lines, Kanpur': { lat: 26.4674, lng: 80.3493 },
  'Naveen Market, Kanpur': { lat: 26.4610, lng: 80.3289 },
};

const CITIES = Object.keys(CITY_COORDS);

const ComparePage = () => {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  const handleCompare = useCallback(async () => {
    if (!pickup || !dropoff) {
      toast.error('Please select both pickup and dropoff locations.');
      return;
    }
    if (pickup === dropoff) {
      toast.error('Pickup and dropoff must be different.');
      return;
    }

    const pickupCoords = CITY_COORDS[pickup];
    const dropoffCoords = CITY_COORDS[dropoff];

    if (!pickupCoords || !dropoffCoords) {
      toast.error('Please select locations from the list.');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const { data } = await api.get('/fares/compare', {
        params: {
          pickup_lat: pickupCoords.lat,
          pickup_lng: pickupCoords.lng,
          dropoff_lat: dropoffCoords.lat,
          dropoff_lng: dropoffCoords.lng,
          pickup_address: pickup,
          dropoff_address: dropoff
        }
      });
      setResults(data);
      toast.success(`Found ${data.fares.length} options!`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to compare fares. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [pickup, dropoff]);

  const handleBook = async (fare) => {
    setBookingId(fare.vehicleType + fare.provider);
    try {
      const cheapestFare = results.recommendation.best.estimatedFare;
      const savedAmount = fare.estimatedFare > cheapestFare ? 0 : results.recommendation.savings;

      const { data } = await api.post('/bookings', {
        pickup: { address: pickup, lat: CITY_COORDS[pickup]?.lat, lng: CITY_COORDS[pickup]?.lng },
        dropoff: { address: dropoff, lat: CITY_COORDS[dropoff]?.lat, lng: CITY_COORDS[dropoff]?.lng },
        selectedProvider: fare.provider,
        vehicleType: fare.vehicleType,
        fare: fare.estimatedFare,
        distance: fare.distance,
        duration: fare.tripDuration,
        allFareOptions: results.fares,
        savedAmount
      });

      toast.success(`🎉 Booking confirmed! Ref: ${data.booking.bookingReference}`);
      setTimeout(() => navigate('/bookings'), 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Booking failed.';
      toast.error(msg);
    } finally {
      setBookingId(null);
    }
  };

  const swap = () => {
    setPickup(dropoff);
    setDropoff(pickup);
    setResults(null);
  };

  return (
    <div className="compare-page">
      <div className="compare-header">
        <h1>Compare Fares</h1>
        <p>Find the cheapest ride across all providers instantly</p>
      </div>

      {/* Search form */}
      <div className="search-card">
        <div className="search-form">
          <div className="search-field">
            <label className="search-label">
              <MapPin size={15} />
              Pickup Location
            </label>
            <select
              className="search-select"
              value={pickup}
              onChange={e => { setPickup(e.target.value); setResults(null); }}
            >
              <option value="">Choose pickup...</option>
              {CITIES.filter(c => c !== dropoff).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button className="swap-btn" onClick={swap} title="Swap locations">
            <RefreshCw size={16} />
          </button>

          <div className="search-field">
            <label className="search-label">
              <Navigation size={15} />
              Dropoff Location
            </label>
            <select
              className="search-select"
              value={dropoff}
              onChange={e => { setDropoff(e.target.value); setResults(null); }}
            >
              <option value="">Choose dropoff...</option>
              {CITIES.filter(c => c !== pickup).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button className="compare-btn" onClick={handleCompare} disabled={loading}>
            {loading ? (
              <span className="spinner" style={{ width: 18, height: 18 }} />
            ) : (
              <><Search size={18} /> Compare Fares</>
            )}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="results-section">
          <div className="results-summary skeleton" style={{ height: 72, marginBottom: 24 }} />
          <div className="fares-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="fare-card skeleton" style={{ height: 240 }} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div className="results-section animate-in">
          {/* Summary bar */}
          <div className="results-summary">
            <div className="summary-item">
              <span className="summary-label">Distance</span>
              <span className="summary-value">{results.distance} km</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Est. Duration</span>
              <span className="summary-value">{results.estimatedDuration} min</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Options Found</span>
              <span className="summary-value">{results.fares.length}</span>
            </div>
            <div className="summary-item highlight">
              <TrendingDown size={14} />
              <span className="summary-label">Max Savings</span>
              <span className="summary-value">₹{results.recommendation.savings}</span>
            </div>
          </div>

          {/* Best deal banner */}
          <div className="best-deal-banner">
            <TrendingDown size={16} />
            <span>
              Best deal: <strong>{results.recommendation.best.providerName} {results.recommendation.best.vehicleType}</strong> at ₹{results.recommendation.best.estimatedFare} — saves you ₹{results.recommendation.savings} ({results.recommendation.savingsPercent}%)
            </span>
          </div>

          {/* Fare cards */}
          <div className="fares-grid">
            {results.fares.map((fare, i) => (
              <FareCard
                key={`${fare.provider}-${fare.vehicleType}`}
                fare={fare}
                isBest={i === 0}
                onBook={handleBook}
                booking={bookingId === fare.vehicleType + fare.provider}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparePage;
