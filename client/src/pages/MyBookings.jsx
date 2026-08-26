import { useEffect, useState } from 'react';
import { HiOutlineCalendar, HiOutlineHome } from 'react-icons/hi';
import { bookingsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/format';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'current', label: 'Current Stay' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function MyBookings() {
  const { showToast } = useToast();
  const [buckets, setBuckets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [cancellingId, setCancellingId] = useState(null);

  const load = () => {
    setLoading(true);
    bookingsApi.mine().then(setBuckets).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCancel = async (booking) => {
    if (!window.confirm(`Cancel booking ${booking.booking_ref}? This can't be undone.`)) return;
    setCancellingId(booking.id);
    try {
      await bookingsApi.cancel(booking.id);
      showToast('Booking cancelled.');
      load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const list = buckets?.[tab] || [];

  return (
    <div className="account-panel">
      <h2 className="text-2xl">My Bookings</h2>
      <p className="account-panel-sub">Every stay you've made or planned with us, in one place.</p>

      <div className="bookings-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`bookings-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} {buckets ? `(${buckets[t.key]?.length || 0})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : list.length === 0 ? (
        <div className="empty-state">
          <h3>Nothing here yet</h3>
          <p>Bookings in this category will show up here.</p>
        </div>
      ) : (
        <div className="bookings-list">
          {list.map((b) => (
            <div className="booking-row" key={b.id}>
              <div className="booking-row-main">
                <strong>{b.room_type_name}</strong>
                <span className="booking-row-ref">{b.booking_ref}</span>
                <div className="booking-row-meta">
                  <span><HiOutlineCalendar size={14} /> {formatDate(b.check_in)} &rarr; {formatDate(b.check_out)}</span>
                  <span><HiOutlineHome size={14} /> {b.num_rooms} room{b.num_rooms > 1 ? 's' : ''} &middot; {b.nights} night{b.nights > 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="booking-row-side">
                <span className={`booking-status-pill status-${b.status.replace(/\s+/g, '-').toLowerCase()}`}>{b.status}</span>
                <strong>{formatCurrency(b.total_amount)}</strong>
                {tab === 'upcoming' && (
                  <button
                    className="btn btn-outline booking-cancel-btn"
                    onClick={() => handleCancel(b)}
                    disabled={cancellingId === b.id}
                  >
                    {cancellingId === b.id ? 'Cancelling…' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
