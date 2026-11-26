import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiCheckCircle, HiOutlinePrinter, HiOutlineDownload } from 'react-icons/hi';
import { bookingsApi, paymentsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/format';
import './BookingConfirmation.css';

export default function BookingConfirmation() {
  const { bookingRef } = useParams();
  const { showToast } = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState({ enabled: false });
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    bookingsApi.byRef(bookingRef)
      .then(setBooking)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookingRef]);

  useEffect(() => {
    paymentsApi.config().then(setPayment).catch(() => {});
  }, []);

  const reload = () => bookingsApi.byRef(bookingRef).then(setBooking);

  const loadCheckout = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load the payment window. Check your connection.'));
    document.body.appendChild(script);
  });

  // The booking only becomes "Paid" after the server verifies Razorpay's
  // signature (here or via webhook); the browser's success callback alone
  // proves nothing.
  const handlePay = async () => {
    setPaying(true);
    try {
      const order = await paymentsApi.createOrder(bookingRef);
      await loadCheckout();
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Aranya Palace Resort & Spa',
        description: `Booking ${bookingRef}`,
        prefill: { name: order.name, email: order.email, contact: order.contact },
        theme: { color: '#A97C43' },
        handler: async (response) => {
          try {
            await paymentsApi.verify(response);
            await reload();
            showToast('Payment received. Thank you!');
          } catch (err) {
            showToast(err.message, 'error');
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.on('payment.failed', (r) => showToast(r.error?.description || 'Payment failed.', 'error'));
      rzp.open();
    } catch (err) {
      showToast(err.message, 'error');
      setPaying(false);
    }
  };

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

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return;
    try {
      await bookingsApi.cancelByRef(bookingRef);
      setBooking({ ...booking, status: 'Cancelled' });
      showToast('Your booking has been cancelled.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const cancellable = ['Pending', 'Confirmed'].includes(booking?.status);

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
            <h1 className="text-2xl">{booking.status === 'Cancelled' ? 'Booking Cancelled' : 'Booking Confirmed'}</h1>
            <p>You can view, pay for or cancel this booking any time from My Bookings.</p>
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
            <div><span>Payment</span><strong>{booking.payment_status}</strong></div>
          </div>

          <div className="confirmation-total">
            <span>Total Amount</span>
            <strong>{formatCurrency(booking.total_amount)}</strong>
          </div>

          <div className="confirmation-actions no-print">
            <button className="btn btn-outline" onClick={() => window.print()}><HiOutlinePrinter size={16} /> Print</button>
            <button className="btn btn-outline" onClick={handleDownload}><HiOutlineDownload size={16} /> Download</button>
            {payment.enabled && cancellable && booking.payment_status !== 'Paid' && (
              <button className="btn btn-brass" onClick={handlePay} disabled={paying}>
                {paying ? 'Opening payment…' : `Pay ${formatCurrency(booking.total_amount)} online`}
              </button>
            )}
            {cancellable && (
              <button className="btn btn-outline" onClick={handleCancel}>Cancel Booking</button>
            )}
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
