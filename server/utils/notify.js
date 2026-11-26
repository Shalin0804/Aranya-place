import { pool } from '../config/db.js';
import { sendEmail } from './email.js';

const EVENTS = {
  created: { guest: 'bookingConfirmed', admin: 'adminNewBooking', type: 'new_booking', text: (b) => `New booking ${b.booking_ref} by ${b.guest_name}` },
  cancelled: { guest: 'bookingCancelled', type: 'booking_cancelled', text: (b) => `Booking ${b.booking_ref} was cancelled` },
  updated: { guest: 'bookingUpdated' },
  paid: { guest: 'paymentReceived', type: 'payment_received', text: (b) => `Payment received for ${b.booking_ref}` },
};

/**
 * Emails the guest (and admin for new bookings) and records an admin
 * notification. Never throws: call without await after the DB commit.
 */
export async function notifyBooking(bookingId, event) {
  try {
    const cfg = EVENTS[event];
    const [[b]] = await pool.query(
      `SELECT b.*, rt.name AS room_type_name FROM bookings b
       JOIN room_types rt ON rt.id = b.room_type_id WHERE b.id = ?`,
      [bookingId]
    );
    if (!b || !cfg) return;
    if (cfg.type) {
      await pool.query(
        `INSERT INTO notifications (audience, type, message) VALUES ('admin', ?, ?)`,
        [cfg.type, cfg.text(b)]
      );
    }
    await Promise.all([
      sendEmail(cfg.guest, b),
      cfg.admin ? sendEmail(cfg.admin, b) : null,
    ]);
  } catch (err) {
    console.error(`[NOTIFY] ${event} for booking ${bookingId} failed:`, err.message);
  }
}
