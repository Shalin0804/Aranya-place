import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <title>Forgot Password — Aranya Palace Resort &amp; Spa</title>
      <div className="auth-media">
        <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200" alt="" />
      </div>
      <div className="auth-panel">
        <div className="auth-form-wrap">
          <p className="eyebrow">Account help</p>
          <h1 className="text-3xl">Forgot your password?</h1>
          {sent ? (
            <p className="auth-sub" role="status">
              If an account exists for <strong>{email}</strong>, we've emailed a link to reset your password.
              It expires in 60 minutes. Check your spam folder if it doesn't arrive.
            </p>
          ) : (
            <>
              <p className="auth-sub">Enter your account email and we'll send you a link to choose a new password.</p>
              <form onSubmit={handleSubmit} className="auth-form">
                <label className="booking-field">
                  <span>Email</span>
                  <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
                {error && <p className="booking-form-error" role="alert">{error}</p>}
                <button type="submit" className="btn btn-brass btn-block" disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
          <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
