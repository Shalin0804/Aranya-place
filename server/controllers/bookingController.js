import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';
import {
  nightsBetween,
  validateDateRange,
  getAvailableRoomCount,
  generateBookingRef,
  findActiveOffer,
} from '../utils/booking.js';

/**
 * POST /api/bookings
 * Creates a booking after re-verifying availability inside a locked transaction,
 * so two guests racing for the last room can never both succeed.
 */
export const createBooking = asyncHandler(async (req, res) => {
  const {
    roomTypeId, checkIn, checkOut, numRooms, adults, children,
    guestName, guestEmail, guestPhone, specialRequests, offerId,
  } = req.body;

  if (!roomTypeId) throw new ApiError(400, 'Please select a room type.');
  if (!guestName || !guestEmail || !guestPhone) {
    throw new ApiError(400, 'Guest name, email, and phone are required.');
  }
  const rooms = Number(numRooms) || 1;
  if (rooms < 1) throw new ApiError(400, 'Number of rooms must be at least 1.');
  const nights = validateDateRange(checkIn, checkOut);

  const conn = await pool.getConnection();
  try {
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
        bookingRef, req.customer?.id || null, guestName.trim(), guestEmail.toLowerCase(), guestPhone,
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

/** GET /api/bookings/ref/:bookingRef — public lookup for the confirmation page */
export const getBookingByRef = asyncHandler(async (req, res) => {
  const [[booking]] = await pool.query(
    `SELECT b.*, rt.name AS room_type_name, rt.slug AS room_type_slug, rt.bed_type, rt.size_sqft
     FROM bookings b JOIN room_types rt ON rt.id = b.room_type_id
     WHERE b.booking_ref = ?`,
    [req.params.bookingRef]
  );
  if (!booking) throw new ApiError(404, 'We could not find a booking with that reference.');
  res.json({ success: true, data: booking });
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
  if (['Cancelled', 'Checked Out', 'Completed'].includes(booking.status)) {
    throw new ApiError(400, `This booking is already ${booking.status.toLowerCase()} and cannot be cancelled.`);
  }

  await pool.query("UPDATE bookings SET status = 'Cancelled' WHERE id = ?", [req.params.id]);
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
