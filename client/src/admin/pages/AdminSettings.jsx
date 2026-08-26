import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await adminApi.settings();

      setSettings(response.data || {});
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function change(e) {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    });
  }

  async function save(e) {
    e.preventDefault();

    setSaving(true);

    try {
      await adminApi.updateSettings(settings);
      alert('Settings updated successfully.');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-loading">
        Loading settings...
      </div>
    );
  }

  return (
    <div>

      <div className="page-intro">
        <div>
          <h2>Hotel Settings</h2>
          <p>Manage your resort information.</p>
        </div>
      </div>

      <div className="admin-panel-card">

        <form
          className="admin-form"
          onSubmit={save}
        >

          <div className="form-grid">

            <div>
              <label>Hotel Name</label>

              <input
                name="hotel_name"
                value={settings.hotel_name || ''}
                onChange={change}
              />
            </div>

            <div>
              <label>Phone</label>

              <input
                name="phone"
                value={settings.phone || ''}
                onChange={change}
              />
            </div>

          </div>

          <label>Email</label>

          <input
            name="email"
            type="email"
            value={settings.email || ''}
            onChange={change}
          />

          <label>Address</label>

          <textarea
            name="address"
            value={settings.address || ''}
            onChange={change}
            rows="3"
          />

          <label>Tax Percentage</label>

          <input
            type="number"
            step="0.01"
            name="tax_percentage"
            value={settings.tax_percentage || ''}
            onChange={change}
          />

          <div className="form-grid">

            <div>
              <label>Check-in Time</label>

              <input
                name="check_in_time"
                value={settings.check_in_time || ''}
                onChange={change}
                placeholder="2:00 PM"
              />
            </div>

            <div>
              <label>Check-out Time</label>

              <input
                name="check_out_time"
                value={settings.check_out_time || ''}
                onChange={change}
                placeholder="11:00 AM"
              />
            </div>

          </div>

          <label>Cancellation Policy</label>

          <textarea
            name="cancellation_policy"
            value={settings.cancellation_policy || ''}
            onChange={change}
            rows="4"
          />

          <button
            className="admin-primary-button"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

        </form>

      </div>

    </div>
  );
}