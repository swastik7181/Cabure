import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthLayout = ({ children, title, subtitle, alternate }) => (
  <div className="auth-page">
    <div className="auth-bg">
      <div className="hero-blob blob-1" />
      <div className="hero-blob blob-2" />
    </div>
    <div className="auth-card animate-in">
      <div className="auth-logo">
        <MapPin size={20} />
        <span>Cabure</span>
      </div>
      <h2 className="auth-title">{title}</h2>
      <p className="auth-subtitle">{subtitle}</p>
      {children}
      <div className="auth-alternate">{alternate}</div>
    </div>
  </div>
);

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Fill in all fields.'); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/compare');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to compare fares and manage your rides."
      alternate={<>New to Cabure? <Link to="/register">Create account</Link></>}
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            className="input-field"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoFocus
          />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <div className="input-wrapper">
            <input
              className="input-field"
              type={showPw ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw(p => !p)}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button className="auth-submit-btn" type="submit" disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Log In'}
        </button>
      </form>
    </AuthLayout>
  );
};

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Fill in required fields.'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      toast.success('Account created! Welcome to Cabure.');
      navigate('/compare');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start saving on every cab ride today."
      alternate={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <label className="input-label">Full Name *</label>
          <input className="input-field" type="text" name="name" value={form.name} onChange={handleChange} placeholder="Rahul Sharma" autoFocus />
        </div>
        <div className="input-group">
          <label className="input-label">Email *</label>
          <input className="input-field" type="email" name="email" value={form.email} onChange={handleChange} placeholder="rahul@example.com" />
        </div>
        <div className="input-group">
          <label className="input-label">Phone (optional)</label>
          <input className="input-field" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" />
        </div>
        <div className="input-group">
          <label className="input-label">Password * (min 6 chars)</label>
          <div className="input-wrapper">
            <input
              className="input-field"
              type={showPw ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
            <button type="button" className="pw-toggle" onClick={() => setShowPw(p => !p)}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button className="auth-submit-btn" type="submit" disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  );
};
