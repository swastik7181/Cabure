import React from 'react';
import { Clock, Navigation, Zap, TrendingDown, Car } from 'lucide-react';

const PROVIDER_CONFIG = {
  uber: { name: 'Uber', emoji: '⚫', accent: '#6366f1' },
  ola: { name: 'Ola', emoji: '🟢', accent: '#10b981' },
  rapido: { name: 'Rapido', emoji: '🟡', accent: '#f59e0b' }
};

const FareCard = ({ fare, isBest, onBook, booking }) => {
  const cfg = PROVIDER_CONFIG[fare.provider] || {};

  return (
    <div className={`fare-card animate-in ${isBest ? 'fare-card-best' : ''}`}>
      {isBest && (
        <div className="fare-best-badge">
          <TrendingDown size={12} />
          Best Deal
        </div>
      )}

      <div className="fare-card-header">
        <div className="fare-provider">
          <div className="fare-provider-logo" style={{ '--provider-accent': cfg.accent }}>
            {cfg.emoji}
          </div>
          <div>
            <div className="fare-provider-name">{cfg.name}</div>
            <div className="fare-vehicle-type">
              <Car size={12} />
              {fare.vehicleType}
            </div>
          </div>
        </div>

        <div className="fare-price">
          <span className="fare-currency">₹</span>
          <span className="fare-amount">{fare.estimatedFare}</span>
        </div>
      </div>

      <div className="fare-meta">
        <div className="fare-meta-item">
          <Clock size={14} />
          <span>{fare.estimatedTime} min away</span>
        </div>
        <div className="fare-meta-item">
          <Navigation size={14} />
          <span>{fare.tripDuration} min trip</span>
        </div>
        <div className="fare-meta-item">
          <Navigation size={14} />
          <span>{fare.distance} km</span>
        </div>
        {fare.surgeMultiplier > 1 && (
          <div className="fare-meta-item surge">
            <Zap size={14} />
            <span>{fare.surgeMultiplier}x surge</span>
          </div>
        )}
      </div>

      {/* Fare breakdown */}
      <details className="fare-breakdown">
        <summary>Fare Breakdown</summary>
        <div className="breakdown-grid">
          <span>Base fare</span><span>₹{fare.breakdown?.baseFare}</span>
          <span>Distance ({fare.distance} km)</span><span>₹{fare.breakdown?.distanceCharge}</span>
          <span>Time ({fare.tripDuration} min)</span><span>₹{fare.breakdown?.timeCharge}</span>
          {fare.breakdown?.surgeCharge > 0 && (
            <>
              <span>Surge charge</span><span className="surge-text">₹{fare.breakdown?.surgeCharge}</span>
            </>
          )}
        </div>
      </details>

      <button
        className={`fare-book-btn ${isBest ? 'best' : ''}`}
        onClick={() => onBook(fare)}
        disabled={booking}
      >
        {booking ? (
          <span className="spinner" style={{ width: 16, height: 16 }} />
        ) : (
          <>Book {cfg.name}</>
        )}
      </button>
    </div>
  );
};

export default FareCard;
