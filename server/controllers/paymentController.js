import crypto from 'node:crypto';
import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';
import { notifyBooking } from '../utils/notify.js';
import { findOwnBooking } from './bookingController.js';

// Razorpay via its REST API (no SDK needed). Use rzp_test_ keys for test
// mode: Razorpay then simulates payments and nothing real is charged.
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');

/** Constant-time comparison of two hex signatures. */
export function signatureMatches(expected, received) {
  if (typeof received !== 'string' || received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

/**
 * Marks the payment for a Razorpay order as paid. Idempotent: the browser
 * callback and the webhook may both arrive for the same payment.
 */
async function markOrderPaid(orderId, paymentId, method = 'razorpay') {
  const [[payment]] = await pool.query(
    'SELECT id, booking_id, status FROM payments WHERE gateway_order_id = ?',
    [orderId]
  );
  if (!payment) return null;
  if (payment.status !== 'Paid') {
    await pool.query(
      `UPDATE payments SET status = 'Paid', transaction_id = ?, method = ?, payment_date = NOW() WHERE id = ?`,
      [paymentId, method, payment.id]
    );
    await pool.query(`UPDATE bookings SET payment_status = 'Paid' WHERE id = ?`, [payment.booking_id]);
    notifyBooking(payment.booking_id, 'paid');
  }
  return payment.booking_id;
}

/** GET /api/payments/config — lets the site show or hide "Pay online". */
export const getPaymentConfig = (req, res) => {
  res.json({ success: true, data: { enabled: Boolean(KEY_ID && KEY_SECRET), keyId: KEY_ID || null, testMode: Boolean(KEY_ID?.startsWith('rzp_test_')) } });
};

/** POST /api/payments/order { bookingRef } (signed-in owner) — creates a Razorpay order for the booking total. */
export const createOrder = asyncHandler(async (req, res) => {
  if (!KEY_ID || !KEY_SECRET) throw new ApiError(503, 'Online payment is not available yet. You can pay at check-in.');
  req.params.bookingRef = req.body.bookingRef;
  const booking = await findOwnBooking(req);
  if (booking.status === 'Cancelled') throw new ApiError(400, 'This booking is cancelled.');
  if (booking.payment_status === 'Paid') throw new ApiError(400, 'This booking is already paid.');

  const amount = Math.round(Number(booking.total_amount) * 100); // paise, from the server-side total
  const rp = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({ amount, currency: 'INR', receipt: booking.booking_ref, notes: { booking_id: String(booking.id) } }),
  });
  const order = await rp.json();
  if (!rp.ok) {
    console.error('[RAZORPAY] order failed:', order?.error?.description);
    throw new ApiError(502, 'Could not start the payment. Please try again.');
  }

  // Reuse the booking's pending payment row; otherwise add one.
  const [upd] = await pool.query(
    `UPDATE payments SET gateway_order_id = ?, amount = ?, method = 'razorpay'
     WHERE booking_id = ? AND status = 'Pending' ORDER BY id DESC LIMIT 1`,
    [order.id, booking.total_amount, booking.id]
  );
  if (!upd.affectedRows) {
    await pool.query(
      `INSERT INTO payments (booking_id, amount, method, status, gateway_order_id) VALUES (?, ?, 'razorpay', 'Pending', ?)`,
      [booking.id, booking.total_amount, order.id]
    );
  }

  res.json({
    success: true,
    data: { orderId: order.id, amount, currency: 'INR', keyId: KEY_ID, name: booking.guest_name, email: booking.guest_email, contact: booking.guest_phone },
  });
});

/** POST /api/payments/verify — checkout success callback; trusts only the HMAC signature. */
export const verifyPayment = asyncHandler(async (req, res) => {
  if (!KEY_SECRET) throw new ApiError(503, 'Online payment is not configured.');
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
  if (!orderId || !paymentId || !signatureMatches(hmac(KEY_SECRET, `${orderId}|${paymentId}`), signature)) {
    throw new ApiError(400, 'Payment could not be verified.');
  }
  const bookingId = await markOrderPaid(orderId, paymentId);
  if (!bookingId) throw new ApiError(404, 'Payment order not found.');
  res.json({ success: true, message: 'Payment verified.' });
});

/**
 * POST /api/payments/webhook — Razorpay server-to-server events. Needs the
 * raw body (mounted before express.json) to check X-Razorpay-Signature.
 */
export const razorpayWebhook = asyncHandler(async (req, res) => {
  if (!WEBHOOK_SECRET) throw new ApiError(503, 'Webhook not configured.');
  const raw = req.body; // Buffer
  if (!Buffer.isBuffer(raw) || !signatureMatches(hmac(WEBHOOK_SECRET, raw), req.get('x-razorpay-signature'))) {
    throw new ApiError(400, 'Invalid signature.');
  }
  const event = JSON.parse(raw.toString('utf8'));
  const p = event.payload?.payment?.entity;
  if (p?.order_id) {
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      await markOrderPaid(p.order_id, p.id, p.method ? `razorpay:${p.method}` : 'razorpay');
    } else if (event.event === 'payment.failed') {
      await pool.query(
        `UPDATE payments SET status = 'Failed', transaction_id = ? WHERE gateway_order_id = ? AND status = 'Pending'`,
        [p.id, p.order_id]
      );
    }
  }
  res.json({ success: true });
});
