import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Settings, TrendingDown, BarChart2, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    preferredProvider: user?.preferredProvider || 'any'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await api.patch('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">{initials}</div>
        <div>
          <h1>{user.name}</h1>
          <p className="profile-email">{user.email}</p>
          <p className="profile-since">Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        {[
          { label: 'Total Rides', value: user.totalRides || 0, icon: <BarChart2 size={16} /> },
          { label: 'Amount Saved', value: `₹${user.totalSaved || 0}`, icon: <TrendingDown size={16} />, green: true },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.green ? 'green' : ''}`}>
            {s.icon}
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Edit Form */}
      <div className="profile-card">
        <div className="profile-card-header">
          <h3><Settings size={16} /> Account Settings</h3>
          {!editing && (
            <button className="edit-btn" onClick={() => setEditing(true)}>Edit Profile</button>
          )}
        </div>

        <div className="profile-fields">
          <div className="profile-field">
            <label><User size={14} /> Full Name</label>
            {editing ? (
              <input className="input-field" name="name" value={form.name} onChange={handleChange} />
            ) : (
              <span>{user.name}</span>
            )}
          </div>

          <div className="profile-field">
            <label><Mail size={14} /> Email</label>
            <span>{user.email}</span>
          </div>

          <div className="profile-field">
            <label><Phone size={14} /> Phone</label>
            {editing ? (
              <input className="input-field" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" />
            ) : (
              <span>{user.phone || '—'}</span>
            )}
          </div>

          <div className="profile-field">
            <label><MapPin size={14} /> Preferred Provider</label>
            {editing ? (
              <select className="input-field" name="preferredProvider" value={form.preferredProvider} onChange={handleChange}>
                <option value="any">Any (Best Price)</option>
                <option value="uber">Uber</option>
                <option value="ola">Ola</option>
                <option value="rapido">Rapido</option>
              </select>
            ) : (
              <span className="capitalize">{user.preferredProvider || 'Any'}</span>
            )}
          </div>
        </div>

        {editing && (
          <div className="profile-actions">
            <button className="btn-save" onClick={handleSave} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Save Changes'}
            </button>
            <button className="btn-cancel" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="danger-zone">
        <button className="logout-btn" onClick={logout}>Log Out</button>
      </div>
    </div>
  );
};

export default ProfilePage;
