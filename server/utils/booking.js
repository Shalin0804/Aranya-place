import crypto from 'node:crypto';
import { pool } from '../config/db.js';
import { ApiError } from './apiError.js';

/** Nights between two YYYY-MM-DD dates (check-out is exclusive). */
export function nightsBetween(checkIn, checkOut) {
  const inDate = new Date(`${checkIn}T00:00:00Z`);
  const outDate = new Date(`${checkOut}T00:00:00Z`);
  const ms = outDate.getTime() - inDate.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function validateDateRange(checkIn, checkOut) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
    throw new ApiError(400, 'Dates must be in YYYY-MM-DD format.');
  }
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) {
    throw new ApiError(400, 'Check-out date must be after the check-in date.');
  }
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (new Date(`${checkIn}T00:00:00Z`) < today) {
    throw new ApiError(400, 'Check-in date cannot be in the past.');
  }
  return nights;
}

/**
 * Computes real-time availability for a room type over a date range.
 * available = (physical rooms of this type, excluding maintenance/out-of-service)
 *             - (rooms already committed by overlapping active bookings)
 * Two ranges overlap when existing.check_in < newCheckOut AND existing.check_out > newCheckIn.
 */
export async function getAvailableRoomCount(roomTypeId, checkIn, checkOut, conn = pool) {
  const [[{ totalUsable }]] = await conn.query(
    `SELECT COUNT(*) AS totalUsable FROM rooms
     WHERE room_type_id = ? AND status NOT IN ('Maintenance', 'Out of Service')`,
    [roomTypeId]
  );

  const [[{ committed }]] = await conn.query(
    `SELECT COALESCE(SUM(num_rooms), 0) AS committed FROM bookings
     WHERE room_type_id = ?
       AND status IN ('Pending', 'Confirmed', 'Checked In')
       AND check_in < ?
       AND check_out > ?`,
    [roomTypeId, checkOut, checkIn]
  );

  return Math.max(0, totalUsable - committed);
}

export function generateBookingRef() {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[crypto.randomInt(chars.length)];
  }
  return `HTL-${year}-${suffix}`;
}

/** A customer can cancel online only before the check-in date. */
export function assertCancellable(booking) {
  if (['Cancelled', 'Checked In', 'Checked Out', 'Completed'].includes(booking.status)) {
    throw new ApiError(400, `This booking is already ${booking.status.toLowerCase()} and cannot be cancelled.`);
  }
  // mysql2 returns DATE columns as local-midnight Dates; compare local
  // calendar days (toISOString would shift the date in IST).
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const checkIn = booking.check_in instanceof Date ? ymd(booking.check_in) : String(booking.check_in).slice(0, 10);
  if (checkIn <= ymd(new Date())) {
    throw new ApiError(400, 'Bookings can only be cancelled online before the check-in date. Please contact the front desk.');
  }
}

export async function findActiveOffer(offerId, roomTypeId, nights, conn = pool) {
  if (!offerId) return null;
  const [[offer]] = await conn.query(
    `SELECT * FROM offers WHERE id = ? AND status = 'Active'
       AND CURDATE() BETWEEN start_date AND end_date
       AND (applicable_room_type_id IS NULL OR applicable_room_type_id = ?)
       AND min_nights <= ?
       AND (max_usage IS NULL OR used_count < max_usage)`,
    [offerId, roomTypeId, nights]
  );
  return offer || null;
}
