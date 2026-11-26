import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      showToast('Password updated. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <title>Reset Password — Aranya Palace Resort &amp; Spa</title>
      <div className="auth-media">
        <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200" alt="" />
      </div>
      <div className="auth-panel">
        <div className="auth-form-wrap">
          <p className="eyebrow">Account help</p>
          <h1 className="text-3xl">Choose a new password</h1>
          {!token ? (
            <p className="auth-sub">This reset link is incomplete. <Link to="/forgot-password">Request a new one</Link>.</p>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <label className="booking-field">
                <span>New password (min. 8 characters)</span>
                <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              <label className="booking-field">
                <span>Confirm new password</span>
                <input type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </label>
              {error && <p className="booking-form-error" role="alert">{error}</p>}
              <button type="submit" className="btn btn-brass btn-block" disabled={submitting}>
                {submitting ? 'Saving…' : 'Reset Password'}
              </button>
            </form>
          )}
          <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
