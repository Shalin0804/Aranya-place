import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiCheckCircle, HiOutlinePrinter, HiOutlineDownload, HiOutlineMail } from 'react-icons/hi';
import { bookingsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/format';
import './BookingConfirmation.css';

export default function BookingConfirmation() {
  const { bookingRef } = useParams();
  const { showToast } = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    bookingsApi.byRef(bookingRef)
      .then(setBooking)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookingRef]);

  const handleDownload = () => {
    if (!booking) return;
    const lines = [
      'ARANYA PALACE RESORT & SPA — BOOKING CONFIRMATION',
      '='.repeat(50),
      `Booking Reference: ${booking.booking_ref}`,
      `Guest Name: ${booking.guest_name}`,
      `Room: ${booking.room_type_name}`,
      `Check-in: ${formatDate(booking.check_in)}`,
      `Check-out: ${formatDate(booking.check_out)}`,
      `Nights: ${booking.nights}`,
      `Rooms: ${booking.num_rooms}`,
      `Guests: ${booking.adults} adult(s), ${booking.children} children`,
      `Total Amount: ${formatCurrency(booking.total_amount)}`,
      `Status: ${booking.status}`,
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${booking.booking_ref}-confirmation.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
    showToast(`Confirmation sent to ${booking.guest_email}`);
  };

  if (loading) return <div className="container confirmation-loading"><div className="skeleton" style={{ height: 400 }} /></div>;

  if (error || !booking) {
    return (
      <div className="container confirmation-error">
        <h2>We couldn't find that booking</h2>
        <p>{error}</p>
        <Link to="/rooms" className="btn btn-primary">Browse Rooms</Link>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="container confirmation-container">
        <div className="confirmation-card">
          <div className="confirmation-head no-print">
            <HiCheckCircle size={48} className="confirmation-icon" />
            <h1 className="text-2xl">Booking Confirmed</h1>
            <p>A confirmation has been sent to {booking.guest_email}.</p>
          </div>

          <div className="confirmation-ref">
            <span>Booking Reference</span>
            <strong>{booking.booking_ref}</strong>
          </div>

          <div className="confirmation-details">
            <div><span>Guest Name</span><strong>{booking.guest_name}</strong></div>
            <div><span>Room</span><strong>{booking.room_type_name}</strong></div>
            <div><span>Check-in</span><strong>{formatDate(booking.check_in)}</strong></div>
            <div><span>Check-out</span><strong>{formatDate(booking.check_out)}</strong></div>
            <div><span>Nights</span><strong>{booking.nights}</strong></div>
            <div><span>Rooms</span><strong>{booking.num_rooms}</strong></div>
            <div><span>Guests</span><strong>{booking.adults} adult{booking.adults > 1 ? 's' : ''}{booking.children > 0 ? `, ${booking.children} children` : ''}</strong></div>
            <div><span>Status</span><strong className="confirmation-status">{booking.status}</strong></div>
          </div>

          <div className="confirmation-total">
            <span>Total Amount</span>
            <strong>{formatCurrency(booking.total_amount)}</strong>
          </div>

          <div className="confirmation-actions no-print">
            <button className="btn btn-outline" onClick={() => window.print()}><HiOutlinePrinter size={16} /> Print</button>
            <button className="btn btn-outline" onClick={handleDownload}><HiOutlineDownload size={16} /> Download</button>
            <button className="btn btn-outline" onClick={handleEmail}><HiOutlineMail size={16} /> Email Confirmation</button>
          </div>

          <div className="confirmation-footer no-print">
            <Link to="/rooms" className="btn btn-brass">Book Another Stay</Link>
            <Link to="/account/bookings" className="btn btn-outline">View My Bookings</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
