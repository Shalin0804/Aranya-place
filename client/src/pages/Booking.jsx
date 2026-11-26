import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { HiOutlineCalendar, HiOutlineUserGroup, HiOutlineHome } from 'react-icons/hi';
import { roomTypesApi, bookingsApi, settingsApi, authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, nightsBetween } from '../utils/format';
import './Booking.css';

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { customer, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const roomTypeId = Number(searchParams.get('roomTypeId'));
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const numRooms = Number(searchParams.get('numRooms')) || 1;
  const guestsParam = Number(searchParams.get('adults') || searchParams.get('guests')) || 2;
  const childrenParam = Number(searchParams.get('children')) || 0;

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [taxRate, setTaxRate] = useState(12);

  const [form, setForm] = useState({
    phone: '',
    adults: Math.min(guestsParam, 99),
    children: Math.min(childrenParam, 4),
    specialRequests: '',
  });

  useEffect(() => {
    if (!roomTypeId || !checkIn || !checkOut) {
      setLoading(false);
      return;
    }
    roomTypesApi.list({ checkIn, checkOut }).then((rooms) => {
      setRoom(rooms.find((r) => r.id === roomTypeId) || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [roomTypeId, checkIn, checkOut]);

  useEffect(() => {
    settingsApi.get().then((s) => s?.tax_percentage != null && setTaxRate(Number(s.tax_percentage))).catch(() => {});
  }, []);

  if (!roomTypeId || !checkIn || !checkOut) {
    return (
      <div className="container booking-error-state">
        <h2>Let's start with a room</h2>
        <p>Choose a room and your dates first, then come back here to complete your booking.</p>
        <Link to="/rooms" className="btn btn-primary">Browse Rooms</Link>
      </div>
    );
  }

  if (loading) return <div className="container booking-error-state"><div className="skeleton" style={{ height: 300 }} /></div>;

  if (!room) {
    return (
      <div className="container booking-error-state">
        <h2>We couldn't load that room</h2>
        <Link to="/rooms" className="btn btn-primary">Browse Rooms</Link>
      </div>
    );
  }

  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = room.base_price * nights * numRooms;
  // Display estimate only; the server recalculates the real total.
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  const isSoldOut = room.availableRooms < numRooms;

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const needsPhone = !customer.phone;
    if (needsPhone && !/^\+?[\d\s()-]{7,20}$/.test(form.phone.trim())) {
      setFormError('Please enter a valid mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      // Name, email and mobile come from the account on the server; a
      // missing mobile number is saved to the profile first.
      if (needsPhone) {
        await authApi.updateProfile({ name: customer.name, phone: form.phone.trim() });
        await refreshProfile();
      }
      const booking = await bookingsApi.create({
        roomTypeId, checkIn, checkOut, numRooms,
        adults: Number(form.adults), children: Number(form.children),
        specialRequests: form.specialRequests.trim() || undefined,
      });
      showToast('Booking confirmed!');
      navigate(`/booking-confirmation/${booking.booking_ref}`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-page">
      <title>Complete Your Booking — Aranya Palace Resort &amp; Spa</title>
      <section className="booking-hero">
        <div className="container">
          <p className="eyebrow">Complete your reservation</p>
          <h1 className="text-3xl">Almost there</h1>
        </div>
      </section>

      <div className="container booking-grid">
        <form className="booking-form" onSubmit={handleSubmit}>
          <h3>Booking Details</h3>

          <section className="booking-customer" aria-label="Your details">
            <div className="booking-customer-head">
              <span>Booking for</span>
              <Link to="/account">Edit profile</Link>
            </div>
            <dl>
              <div><dt>Full name</dt><dd>{customer.name}</dd></div>
              <div><dt>Email address</dt><dd>{customer.email}</dd></div>
              <div>
                <dt>Mobile number</dt>
                <dd>{customer.phone || <span className="booking-customer-missing">Not added yet</span>}</dd>
              </div>
            </dl>
            {!customer.phone && (
              <label className="booking-field booking-customer-phone">
                <span>Add your mobile number *</span>
                <input type="tel" autoComplete="tel" required value={form.phone} onChange={handleChange('phone')} placeholder="+91 98765 43210" />
              </label>
            )}
          </section>

          <h4 className="booking-subhead">Your stay</h4>
          <div className="booking-field-row">
            <div className="booking-field-row" style={{ flex: 1 }}>
              <label className="booking-field">
                <span>Adults</span>
                <select value={form.adults} onChange={handleChange('adults')}>
                  {Array.from({ length: room.max_guests * numRooms }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </label>
              <label className="booking-field">
                <span>Children</span>
                <select value={form.children} onChange={handleChange('children')}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <label className="booking-field">
            <span>Special requests (optional)</span>
            <textarea
              rows={4}
              placeholder="Late check-in, dietary needs, celebration setup…"
              value={form.specialRequests}
              onChange={handleChange('specialRequests')}
            />
          </label>

          {formError && <p className="booking-form-error" role="alert">{formError}</p>}

          {isSoldOut && (
            <p className="booking-form-error" role="alert">
              Only {room.availableRooms} room(s) left for these dates — please reduce your room count and search again.
            </p>
          )}

          <button type="submit" className="btn btn-brass btn-block" disabled={submitting || isSoldOut}>
            {submitting ? 'Confirming your stay…' : `Confirm Booking — ${formatCurrency(total)}`}
          </button>
        </form>

        <aside className="booking-summary">
          <div className="booking-summary-card">
            <img src={room.images[0]} alt={room.name} />
            <div className="booking-summary-body">
              <p className="eyebrow">{room.tagline}</p>
              <h3>{room.name}</h3>

              <div className="booking-summary-line"><HiOutlineCalendar size={16} /> {formatDate(checkIn)} &rarr; {formatDate(checkOut)}</div>
              <div className="booking-summary-line"><HiOutlineHome size={16} /> {nights} night{nights === 1 ? '' : 's'} &middot; {numRooms} room{numRooms > 1 ? 's' : ''}</div>
              <div className="booking-summary-line"><HiOutlineUserGroup size={16} /> {form.adults} adult{form.adults > 1 ? 's' : ''}{form.children > 0 ? `, ${form.children} children` : ''}</div>

              <div className="booking-price-breakdown">
                <div><span>Price per night</span><span>{formatCurrency(room.base_price)}</span></div>
                <div><span>{formatCurrency(room.base_price)} &times; {nights} night{nights === 1 ? '' : 's'} &times; {numRooms} room{numRooms > 1 ? 's' : ''}</span><span>{formatCurrency(subtotal)}</span></div>
                <div><span>Taxes ({taxRate}%)</span><span>{formatCurrency(tax)}</span></div>
                <div className="rd-total"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
