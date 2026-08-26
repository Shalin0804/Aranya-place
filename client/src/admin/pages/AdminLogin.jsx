import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/adminApi';
import '../styles/admin.css';

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await adminLogin(
        form.email,
        form.password
      );

      localStorage.setItem(
        'adminToken',
        response.data.token
      );

      localStorage.setItem(
        'adminUser',
        JSON.stringify(response.data.admin)
      );

      navigate('/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        <div className="login-logo">
          <div>A</div>
        </div>

        <h1>Aranya Palace</h1>

        <p className="login-subtitle">
          Administration Portal
        </p>

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Email Address</label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="admin@aranyapalace.in"
            required
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
          />

          <button
            type="submit"
            className="admin-primary-button login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <button
          className="back-website"
          onClick={() => navigate('/')}
        >
          ← Back to website
        </button>

      </div>
    </div>
  );
}