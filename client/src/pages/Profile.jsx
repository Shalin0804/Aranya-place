import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';

export default function Profile() {
  const { customer, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: customer?.name || '', phone: customer?.phone || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await authApi.updateProfile(form);
      await refreshProfile();
      showToast('Profile updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="account-panel">
      <h2 className="text-2xl">Profile</h2>
      <p className="account-panel-sub">Update the details we use for your bookings.</p>

      <form onSubmit={handleSubmit} className="profile-form">
        <label className="booking-field">
          <span>Full name</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label className="booking-field">
          <span>Email</span>
          <input value={customer?.email} disabled />
        </label>
        <label className="booking-field">
          <span>Phone</span>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>

        {error && <p className="booking-form-error" role="alert">{error}</p>}

        <button type="submit" className="btn btn-brass" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
