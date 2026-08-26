import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, History, User, LogOut, Menu, X, Zap } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = user ? [
    { to: '/compare', label: 'Compare', icon: <Zap size={16} /> },
    { to: '/bookings', label: 'My Rides', icon: <History size={16} /> },
    { to: '/profile', label: 'Profile', icon: <User size={16} /> },
  ] : [];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <MapPin size={18} />
          </div>
          <span>Cabure</span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-links">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <span className="nav-user-name">{user.name.split(' ')[0]}</span>
              <button className="nav-logout" onClick={handleLogout} title="Logout">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Log in</Link>
              <Link to="/register" className="btn-nav-cta">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className="mobile-nav-link">
              {link.icon} {link.label}
            </Link>
          ))}
          {user ? (
            <button className="mobile-nav-link" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="mobile-nav-link">Log in</Link>
              <Link to="/register" className="mobile-nav-link accent">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
