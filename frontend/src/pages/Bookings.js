import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock, MapPin, Navigation, TrendingDown, X, BarChart2 } from 'lucide-react';
import api from '../utils/api';

const STATUS_COLORS = {
  confirmed: '#6366f1',
  pending: '#f59e0b',
  in_progress: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444'
};

const PROVIDER_EMOJIS = { uber: '⚫', ola: '🟢', rapido: '🟡' };

const BookingCard = ({ booking, onCancel }) => {
  const date = new Date(booking.createdAt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="booking-card animate-in">
      <div className="booking-card-header">
        <div className="booking-provider">
          <span className="provider-emoji">{PROVIDER_EMOJIS[booking.selectedProvider]}</span>
          <div>
            <div className="booking-provider-name">{booking.selectedProvider.toUpperCase()} · {booking.vehicleType}</div>
            <div className="booking-ref">{booking.bookingReference}</div>
          </div>
        </div>
        <div className="booking-right">
          <div className="booking-fare">₹{booking.fare}</div>
          <span className="booking-status" style={{ color: STATUS_COLORS[booking.status] }}>
            {booking.status}
          </span>
        </div>
      </div>

      <div className="booking-route">
        <div className="route-stop">
          <div className="route-dot pickup" />
          <span>{booking.pickup?.address}</span>
        </div>
        <div className="route-line" />
        <div className="route-stop">
          <div className="route-dot dropoff" />
          <span>{booking.dropoff?.address}</span>
        </div>
      </div>

      <div className="booking-meta">
        <span><Clock size={13} /> {date}</span>
        {booking.distance && <span><Navigation size={13} /> {booking.distance} km</span>}
        {booking.savedAmount > 0 && (
          <span className="saved-badge">
            <TrendingDown size={13} /> Saved ₹{booking.savedAmount}
          </span>
        )}
      </div>

      {['confirmed', 'pending'].includes(booking.status) && (
        <button className="cancel-booking-btn" onClick={() => onCancel(booking._id)}>
          <X size={14} /> Cancel Booking
        </button>
      )}
    </div>
  );
};

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [filter, setFilter] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 8 };
      if (filter) params.status = filter;
      const { data } = await api.get('/bookings', { params });
      setBookings(data.bookings);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/bookings/stats/summary');
      setStats(data.stats);
    } catch {}
  }, []);

  useEffect(() => { fetchBookings(); fetchStats(); }, [fetchBookings, fetchStats]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.patch(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled.');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancellation failed.');
    }
  };

  return (
    <div className="bookings-page">
      <div className="bookings-header">
        <h1>My Rides</h1>
        <Link to="/compare" className="btn-compare-now">+ Compare New Ride</Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-row">
          {[
            { label: 'Total Rides', value: stats.totalBookings || 0, icon: <BarChart2 size={16} /> },
            { label: 'Total Spent', value: `₹${Math.round(stats.totalSpent || 0)}`, icon: <MapPin size={16} /> },
            { label: 'Total Saved', value: `₹${Math.round(stats.totalSaved || 0)}`, icon: <TrendingDown size={16} />, green: true },
            { label: 'Distance', value: `${Math.round(stats.totalDistance || 0)} km`, icon: <Navigation size={16} /> }
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.green ? 'green' : ''}`}>
              {s.icon}
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bookings-filters">
        {['', 'confirmed', 'completed', 'cancelled'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => { setFilter(f); setPage(1); }}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bookings-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="booking-card skeleton" style={{ height: 180 }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && bookings.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🚗</div>
          <h3>No rides yet</h3>
          <p>Start comparing fares to book your first ride.</p>
          <Link to="/compare" className="btn-compare-now" style={{ marginTop: 16 }}>
            Compare Fares
          </Link>
        </div>
      )}

      {/* Booking list */}
      {!loading && bookings.length > 0 && (
        <>
          <div className="bookings-list">
            {bookings.map(b => (
              <BookingCard key={b._id} booking={b} onCancel={handleCancel} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="page-btn">← Prev</button>
              <span>Page {page} of {pagination.pages}</span>
              <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)} className="page-btn">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BookingsPage;
