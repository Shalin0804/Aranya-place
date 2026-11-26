import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const from = location.state?.from;
  const bookingPending = from?.startsWith('/booking');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      showToast('Welcome back!');
      navigate(from || '/account', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-media">
        <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200" alt="" />
      </div>
      <div className="auth-panel">
        <div className="auth-form-wrap">
          <p className="eyebrow">Welcome back</p>
          <h1 className="text-3xl">Sign in to your account</h1>
          <p className="auth-sub">
            {bookingPending
              ? 'Sign in or create an account to complete your booking. Your room and dates are saved.'
              : 'Track your bookings and check in faster next time.'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="booking-field">
              <span>Email</span>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="booking-field">
              <span>Password</span>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </label>

            <Link to="/forgot-password" className="auth-forgot">Forgot password?</Link>

            {error && <p className="booking-form-error" role="alert">{error}</p>}

            <button type="submit" className="btn btn-brass btn-block" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="auth-demo-hint">Demo login: demo@aranyapalace.in / Guest@1234</p>
          <p className="auth-switch">New here? <Link to="/register" state={{ from }}>Create an account</Link></p>
        </div>
      </div>
    </div>
  );
}
