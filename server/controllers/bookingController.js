import { pool } from '../config/db.js';
import { notifyBooking } from '../utils/notify.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';
import {
  nightsBetween,
  validateDateRange,
  getAvailableRoomCount,
  generateBookingRef,
  assertCancellable,
  findActiveOffer,
} from '../utils/booking.js';

/**
 * POST /api/bookings
 * Creates a booking after re-verifying availability inside a locked transaction,
 * so two guests racing for the last room can never both succeed.
 */
export const createBooking = asyncHandler(async (req, res) => {
  const {
    roomTypeId, checkIn, checkOut, numRooms, adults, children, specialRequests, offerId,
  } = req.body;

  if (!roomTypeId) throw new ApiError(400, 'Please select a room type.');
  if (specialRequests != null && (typeof specialRequests !== 'string' || specialRequests.length > 1000)) {
    throw new ApiError(400, 'Special requests must be under 1000 characters.');
  }

  // Every booking belongs to a signed-in, active customer. Contact details
  // come from the account record, never from the request body.
  const [[account]] = await pool.query(
    'SELECT id, name, email, phone, status FROM customers WHERE id = ?',
    [req.customer.id]
  );
  if (!account || account.status !== 'Active') {
    throw new ApiError(401, 'Please sign in with an active account to book.');
  }
  if (!account.phone?.trim()) {
    throw new ApiError(400, 'Please add a mobile number to your profile before booking.');
  }

  const rooms = Number(numRooms) || 1;
  if (!Number.isInteger(rooms) || rooms < 1 || rooms > 10) throw new ApiError(400, 'You can book between 1 and 10 rooms.');
  if (!Number.isInteger(Number(adults) || 1) || (Number(adults) || 1) < 1 || (Number(children) || 0) < 0) {
    throw new ApiError(400, 'Please enter a valid number of guests.');
  }
  const nights = validateDateRange(checkIn, checkOut);

  const conn = await pool.getConnection();
  try {
    // READ COMMITTED is required on TiDB: under REPEATABLE READ its snapshot
    // is fixed when the FOR UPDATE below *starts*, so a booking committed
    // while we waited for the lock would be invisible to the availability
    // count and the room would be double-booked. The lock serializes us;
    // RC makes each subsequent read see the latest commits.
    await conn.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await conn.beginTransaction();

    // Serialize concurrent booking attempts for this room type.
    const [[roomType]] = await conn.query('SELECT * FROM room_types WHERE id = ? FOR UPDATE', [roomTypeId]);
    if (!roomType) throw new ApiError(404, 'We could not find that room type.');

    const totalGuests = (Number(adults) || 1) + (Number(children) || 0);
    if (totalGuests > roomType.max_guests * rooms) {
      throw new ApiError(400, `This room type sleeps up to ${roomType.max_guests} guests per room.`);
    }

    const available = await getAvailableRoomCount(roomTypeId, checkIn, checkOut, conn);
    if (rooms > available) {
      throw new ApiError(409, available === 0
        ? 'Sorry, this room type is fully booked for the selected dates.'
        : `Only ${available} room(s) of this type are available for the selected dates.`);
    }

    const roomPrice = Number(roomType.base_price);
    const subtotal = roomPrice * nights * rooms;

    const [[settings]] = await conn.query('SELECT tax_percentage FROM hotel_settings WHERE id = 1');
    const taxPercentage = settings ? Number(settings.tax_percentage) : 12;

    let discountAmount = 0;
    let appliedOfferId = null;
    const offer = await findActiveOffer(offerId, roomTypeId, nights, conn);
    if (offer) {
      discountAmount = offer.discount_type === 'percentage'
        ? subtotal * (Number(offer.discount_value) / 100)
        : Math.min(Number(offer.discount_value), subtotal);
      appliedOfferId = offer.id;
    }

    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxPercentage / 100);
    const totalAmount = taxableAmount + taxAmount;

    let bookingRef = generateBookingRef();
    for (let attempt = 0; attempt < 5; attempt++) {
      const [[clash]] = await conn.query('SELECT id FROM bookings WHERE booking_ref = ?', [bookingRef]);
      if (!clash) break;
      bookingRef = generateBookingRef();
    }

    const [result] = await conn.query(
      `INSERT INTO bookings
        (booking_ref, customer_id, guest_name, guest_email, guest_phone, room_type_id,
         check_in, check_out, nights, num_rooms, adults, children, special_requests,
         room_price, subtotal, tax_amount, discount_amount, total_amount, offer_id,
         status, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', 'Pending')`,
      [
        bookingRef, account.id, account.name, account.email, account.phone.trim(),
        roomTypeId, checkIn, checkOut, nights, rooms, Number(adults) || 1, Number(children) || 0,
        specialRequests || null, roomPrice, subtotal, taxAmount, discountAmount, totalAmount, appliedOfferId,
      ]
    );

    await conn.query(
      `INSERT INTO payments (booking_id, amount, status) VALUES (?, ?, 'Pending')`,
      [result.insertId, totalAmount]
    );

    if (appliedOfferId) {
      await conn.query('UPDATE offers SET used_count = used_count + 1 WHERE id = ?', [appliedOfferId]);
    }

    await conn.commit();
    notifyBooking(result.insertId, 'created');

    const [[booking]] = await pool.query(
      `SELECT b.*, rt.name AS room_type_name, rt.slug AS room_type_slug
       FROM bookings b JOIN room_types rt ON rt.id = b.room_type_id WHERE b.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

/**
 * Loads a booking by reference for the signed-in customer who owns it.
 * Anyone else gets the same 404, so references can't be probed.
 */
export async function findOwnBooking(req) {
  const [[booking]] = await pool.query(
    `SELECT b.*, rt.name AS room_type_name, rt.slug AS room_type_slug, rt.bed_type, rt.size_sqft
     FROM bookings b JOIN room_types rt ON rt.id = b.room_type_id
     WHERE b.booking_ref = ? AND b.customer_id = ?`,
    [req.params.bookingRef, req.customer.id]
  );
  if (!booking) throw new ApiError(404, 'We could not find a booking with that reference.');
  return booking;
}

/** GET /api/bookings/ref/:bookingRef — confirmation page for the owning customer */
export const getBookingByRef = asyncHandler(async (req, res) => {
  const booking = await findOwnBooking(req);
  delete booking.access_token;
  res.json({ success: true, data: booking });
});

/** PUT /api/bookings/ref/:bookingRef/cancel — owning customer cancels */
export const cancelBookingByRef = asyncHandler(async (req, res) => {
  const booking = await findOwnBooking(req);
  assertCancellable(booking);
  await pool.query("UPDATE bookings SET status = 'Cancelled' WHERE id = ?", [booking.id]);
  notifyBooking(booking.id, 'cancelled');
  res.json({ success: true, message: 'Booking cancelled.' });
});

/** GET /api/bookings/me — the logged-in customer's bookings, bucketed by stay status */
export const getMyBookings = asyncHandler(async (req, res) => {
  const [bookings] = await pool.query(
    `SELECT b.*, rt.name AS room_type_name, rt.slug AS room_type_slug
     FROM bookings b JOIN room_types rt ON rt.id = b.room_type_id
     WHERE b.customer_id = ? ORDER BY b.check_in DESC`,
    [req.customer.id]
  );

  const today = new Date().toISOString().slice(0, 10);
  const bucket = { upcoming: [], current: [], completed: [], cancelled: [] };
  for (const b of bookings) {
    const checkIn = b.check_in.toISOString ? b.check_in.toISOString().slice(0, 10) : b.check_in;
    const checkOut = b.check_out.toISOString ? b.check_out.toISOString().slice(0, 10) : b.check_out;
    if (b.status === 'Cancelled') bucket.cancelled.push(b);
    else if (b.status === 'Checked Out' || b.status === 'Completed') bucket.completed.push(b);
    else if (checkIn <= today && checkOut > today) bucket.current.push(b);
    else if (checkIn > today) bucket.upcoming.push(b);
    else bucket.completed.push(b);
  }
  res.json({ success: true, data: bucket });
});

/** PUT /api/bookings/:id/cancel — customer cancels their own upcoming booking */
export const cancelBooking = asyncHandler(async (req, res) => {
  const [[booking]] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
  if (!booking) throw new ApiError(404, 'Booking not found.');
  if (booking.customer_id !== req.customer.id) throw new ApiError(403, 'You can only cancel your own bookings.');
  assertCancellable(booking);

  await pool.query("UPDATE bookings SET status = 'Cancelled' WHERE id = ?", [req.params.id]);
  notifyBooking(booking.id, 'cancelled');
  res.json({ success: true, message: 'Booking cancelled.' });
});

/** GET /api/availability?checkIn=&checkOut=&guests= — quick search used by the homepage widget */
export const searchAvailability = asyncHandler(async (req, res) => {
  const { checkIn, checkOut, guests } = req.query;
  if (!checkIn || !checkOut) throw new ApiError(400, 'Please provide check-in and check-out dates.');
  const nights = validateDateRange(checkIn, checkOut);

  let [roomTypes] = await pool.query('SELECT * FROM room_types ORDER BY sort_order');
  if (guests) roomTypes = roomTypes.filter((rt) => rt.max_guests >= Number(guests));

  const results = await Promise.all(
    roomTypes.map(async (rt) => ({
      ...rt,
      nights,
      availableRooms: await getAvailableRoomCount(rt.id, checkIn, checkOut),
    }))
  );

  res.json({ success: true, data: results });
});
