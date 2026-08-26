import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Zap, Shield, TrendingDown, ArrowRight, Star } from 'lucide-react';

const FEATURES = [
  {
    icon: <Zap size={22} />,
    title: 'Real-Time Comparison',
    desc: 'Instantly compare fares from Uber, Ola, and Rapido side by side in seconds.'
  },
  {
    icon: <TrendingDown size={22} />,
    title: 'Smart Recommendations',
    desc: 'Our engine pinpoints the most economical option, accounting for surge pricing.'
  },
  {
    icon: <Shield size={22} />,
    title: 'Secure Booking',
    desc: 'JWT-authenticated sessions and encrypted data keep your bookings safe.'
  },
  {
    icon: <Star size={22} />,
    title: 'Booking History',
    desc: 'Track all your rides, savings, and spending in one clean dashboard.'
  }
];

const STATS = [
  { value: '3+', label: 'Providers' },
  { value: '₹200+', label: 'Avg. Savings' },
  { value: '10s', label: 'Compare Time' },
  { value: '100%', label: 'Free to Use' }
];

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-blob blob-1" />
          <div className="hero-blob blob-2" />
          <div className="hero-grid" />
        </div>

        <div className="hero-content animate-in">
          <div className="hero-eyebrow">
            <MapPin size={14} />
            India's Fare Comparison Engine
          </div>
          <h1 className="hero-title">
            Stop Overpaying<br />
            <span className="hero-accent">for Every Ride</span>
          </h1>
          <p className="hero-desc">
            Cabure compares Uber, Ola, and Rapido fares in real-time
            and shows you the cheapest option — instantly.
          </p>
          <div className="hero-cta-group">
            <Link to={user ? '/compare' : '/register'} className="btn-hero-primary">
              {user ? 'Compare Fares Now' : 'Get Started — Free'}
              <ArrowRight size={18} />
            </Link>
            {!user && (
              <Link to="/login" className="btn-hero-secondary">
                Already have an account?
              </Link>
            )}
          </div>

          {/* Mini stats */}
          <div className="hero-stats">
            {STATS.map(s => (
              <div key={s.label} className="hero-stat">
                <div className="hero-stat-value">{s.value}</div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-header">
          <h2>Why Cabure?</h2>
          <p>Everything you need to ride smarter, spend less.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Providers */}
      <section className="providers-section">
        <div className="section-header">
          <h2>Supported Providers</h2>
          <p>We integrate with India's top cab services.</p>
        </div>
        <div className="providers-row">
          {[
            { name: 'Uber', emoji: '⚫', desc: 'UberGo, Premier, XL, Auto' },
            { name: 'Ola', emoji: '🟢', desc: 'Mini, Prime, SUV, Auto' },
            { name: 'Rapido', emoji: '🟡', desc: 'Bike, Auto, Cab' }
          ].map(p => (
            <div key={p.name} className="provider-pill">
              <span className="provider-pill-emoji">{p.emoji}</span>
              <div>
                <div className="provider-pill-name">{p.name}</div>
                <div className="provider-pill-desc">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card">
          <h2>Ready to save on every ride?</h2>
          <p>Join thousands of smart commuters using Cabure daily.</p>
          <Link to={user ? '/compare' : '/register'} className="btn-hero-primary">
            {user ? 'Compare Now' : 'Create Free Account'}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
