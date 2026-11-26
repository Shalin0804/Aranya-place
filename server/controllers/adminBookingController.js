import { pool } from '../config/db.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';
import { notifyBooking } from '../utils/notify.js';

/**
 * GET /api/admin/bookings
 */
export const getAdminBookings = asyncHandler(async (req, res) => {
  const {
    status,
    paymentStatus,
    search,
    page = 1,
    limit = 20,
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const offset = (pageNumber - 1) * limitNumber;

  const conditions = [];
  const params = [];

  if (status && status !== 'all') {
    conditions.push('b.status = ?');
    params.push(status);
  }

  if (paymentStatus && paymentStatus !== 'all') {
    conditions.push('b.payment_status = ?');
    params.push(paymentStatus);
  }

  if (search && search.trim()) {
    const value = `%${search.trim()}%`;

    conditions.push(`
      (
        b.booking_ref LIKE ?
        OR b.guest_name LIKE ?
        OR b.guest_email LIKE ?
        OR b.guest_phone LIKE ?
        OR rt.name LIKE ?
      )
    `);

    params.push(
      value,
      value,
      value,
      value,
      value
    );
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

  // Count
  const [[countResult]] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM bookings b
    LEFT JOIN room_types rt
      ON rt.id = b.room_type_id
    ${whereClause}
    `,
    params
  );

  // Bookings
  const [bookings] = await pool.query(
    `
    SELECT
      b.id,
      b.booking_ref,
      b.customer_id,
      b.guest_name,
      b.guest_email,
      b.guest_phone,
      b.room_type_id,

      rt.name AS room_type_name,
      rt.slug AS room_type_slug,

      b.check_in,
      b.check_out,
      b.nights,
      b.num_rooms,
      b.adults,
      b.children,

      b.special_requests,

      b.room_price,
      b.subtotal,
      b.tax_amount,
      b.discount_amount,
      b.total_amount,

      b.offer_id,

      b.status,
      b.payment_status,

      b.created_at

    FROM bookings b

    LEFT JOIN room_types rt
      ON rt.id = b.room_type_id

    ${whereClause}

    ORDER BY b.created_at DESC

    LIMIT ?
    OFFSET ?
    `,
    [
      ...params,
      limitNumber,
      offset,
    ]
  );

  const total = Number(
    countResult?.total || 0
  );

  res.json({
    success: true,

    data: {
      bookings,

      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(
          total / limitNumber
        ),
      },
    },
  });
});


/**
 * GET /api/admin/bookings/:id
 */
export const getAdminBookingById = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    const [[booking]] =
      await pool.query(
        `
        SELECT
          b.*,

          rt.name AS room_type_name,
          rt.slug AS room_type_slug,
          rt.bed_type,
          rt.size_sqft,

          c.name AS customer_name,
          c.email AS customer_email,
          c.phone AS customer_phone

        FROM bookings b

        LEFT JOIN room_types rt
          ON rt.id = b.room_type_id

        LEFT JOIN customers c
          ON c.id = b.customer_id

        WHERE b.id = ?
        `,
        [id]
      );

    if (!booking) {
      throw new ApiError(
        404,
        'Booking not found.'
      );
    }

    const [payments] =
      await pool.query(
        `
        SELECT *
        FROM payments
        WHERE booking_id = ?
        ORDER BY created_at DESC
        `,
        [id]
      );

    res.json({
      success: true,

      data: {
        booking,
        payments,
      },
    });
  }
);


/**
 * PUT /api/admin/bookings/:id/status
 */
export const updateBookingStatus =
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      'Confirmed',
      'Checked In',
      'Checked Out',
      'Completed',
      'Cancelled',
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(
        400,
        'Invalid booking status.'
      );
    }

    const [[booking]] =
      await pool.query(
        `
        SELECT id, status
        FROM bookings
        WHERE id = ?
        `,
        [id]
      );

    if (!booking) {
      throw new ApiError(
        404,
        'Booking not found.'
      );
    }

    await pool.query(
      `
      UPDATE bookings
      SET status = ?
      WHERE id = ?
      `,
      [
        status,
        id,
      ]
    );

    if (status !== booking.status) {
      notifyBooking(booking.id, status === 'Cancelled' ? 'cancelled' : 'updated');
    }

    res.json({
      success: true,
      message:
        `Booking marked as ${status}.`,
    });
  });


/**
 * PUT /api/admin/bookings/:id/payment-status
 */
export const updatePaymentStatus =
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const allowedStatuses = [
      'Pending',
      'Paid',
      'Failed',
      'Refunded',
    ];

    if (
      !allowedStatuses.includes(
        paymentStatus
      )
    ) {
      throw new ApiError(
        400,
        'Invalid payment status.'
      );
    }

    const [[booking]] =
      await pool.query(
        `
        SELECT id
        FROM bookings
        WHERE id = ?
        `,
        [id]
      );

    if (!booking) {
      throw new ApiError(
        404,
        'Booking not found.'
      );
    }

    await pool.query(
      `
      UPDATE bookings
      SET payment_status = ?
      WHERE id = ?
      `,
      [
        paymentStatus,
        id,
      ]
    );

    // Update latest payment record
    const [payments] =
      await pool.query(
        `
        SELECT id
        FROM payments
        WHERE booking_id = ?
        ORDER BY id DESC
        LIMIT 1
        `,
        [id]
      );

    if (payments.length > 0) {
      await pool.query(
        `
        UPDATE payments
        SET status = ?
        WHERE id = ?
        `,
        [
          paymentStatus,
          payments[0].id,
        ]
      );
    }

    if (paymentStatus === 'Paid') notifyBooking(booking.id, 'paid');

    res.json({
      success: true,

      message:
        `Payment marked as ${paymentStatus}.`,
    });
  });


/**
 * PUT /api/admin/bookings/:id/cancel
 */
export const cancelAdminBooking =
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [[booking]] =
      await pool.query(
        `
        SELECT id, status
        FROM bookings
        WHERE id = ?
        `,
        [id]
      );

    if (!booking) {
      throw new ApiError(
        404,
        'Booking not found.'
      );
    }

    if (
      booking.status === 'Cancelled'
    ) {
      throw new ApiError(
        400,
        'Booking is already cancelled.'
      );
    }

    if (
      booking.status === 'Checked Out' ||
      booking.status === 'Completed'
    ) {
      throw new ApiError(
        400,
        'Completed bookings cannot be cancelled.'
      );
    }

    await pool.query(
      `
      UPDATE bookings
      SET status = 'Cancelled'
      WHERE id = ?
      `,
      [id]
    );

    notifyBooking(booking.id, 'cancelled');

    res.json({
      success: true,

      message:
        'Booking cancelled successfully.',
    });
  });