import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await register(form);
      showToast('Account created — welcome to Aranya Palace!');
      navigate('/account');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-media">
        <img src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200" alt="" />
      </div>
      <div className="auth-panel">
        <div className="auth-form-wrap">
          <p className="eyebrow">Join us</p>
          <h1 className="text-3xl">Create your account</h1>
          <p className="auth-sub">Faster checkout, saved details, and a running history of your stays.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="booking-field">
              <span>Full name</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="booking-field">
              <span>Email</span>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="booking-field">
              <span>Phone</span>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="booking-field">
              <span>Password (min. 8 characters)</span>
              <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </label>

            {error && <p className="booking-form-error" role="alert">{error}</p>}

            <button type="submit" className="btn btn-brass btn-block" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
