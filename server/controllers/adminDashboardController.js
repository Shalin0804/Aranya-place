import { pool } from '../config/db.js';
import { asyncHandler } from '../utils/apiError.js';

export const getDashboardStats = asyncHandler(
  async (req, res) => {

    /* =====================================================
       TOTAL BOOKINGS
    ===================================================== */

    const [[totalBookings]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM bookings
    `);


    /* =====================================================
       TODAY'S BOOKINGS
    ===================================================== */

    const [[todayBookings]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM bookings
      WHERE DATE(created_at) = CURDATE()
    `);


    /* =====================================================
       PENDING BOOKINGS
    ===================================================== */

    const [[pendingBookings]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM bookings
      WHERE status = 'Pending'
    `);

    const [[pendingReviews]] = await pool.query(`
  SELECT COUNT(*) AS total
  FROM reviews
  WHERE status = 'Pending'
`);


const [[activeOffers]] = await pool.query(`
  SELECT COUNT(*) AS total
  FROM offers
  WHERE status = 'Active'
`);
    /* =====================================================
       CONFIRMED BOOKINGS
    ===================================================== */

    const [[confirmedBookings]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM bookings
      WHERE status = 'Confirmed'
    `);


    /* =====================================================
       CANCELLED BOOKINGS
    ===================================================== */

    const [[cancelledBookings]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM bookings
      WHERE status = 'Cancelled'
    `);


    /* =====================================================
       COMPLETED BOOKINGS
    ===================================================== */

    const [[completedBookings]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM bookings
      WHERE status = 'Completed'
    `);


    /* =====================================================
       TOTAL CUSTOMERS
    ===================================================== */

    const [[totalCustomers]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM customers
    `);


    /* =====================================================
       TODAY'S CUSTOMERS
    ===================================================== */

    const [[todayCustomers]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM customers
      WHERE DATE(created_at) = CURDATE()
    `);


    /* =====================================================
       TOTAL REVENUE
    ===================================================== */

    const [[totalRevenue]] = await pool.query(`
      SELECT COALESCE(
        SUM(total_amount),
        0
      ) AS total
      FROM bookings
      WHERE payment_status = 'Paid'
        AND status != 'Cancelled'
    `);


    /* =====================================================
       TODAY'S REVENUE
    ===================================================== */

    const [[todayRevenue]] = await pool.query(`
      SELECT COALESCE(
        SUM(total_amount),
        0
      ) AS total
      FROM bookings
      WHERE payment_status = 'Paid'
        AND status != 'Cancelled'
        AND DATE(created_at) = CURDATE()
    `);


    /* =====================================================
       PENDING PAYMENTS
    ===================================================== */

    const [[pendingPayments]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM bookings
      WHERE payment_status = 'Pending'
    `);


    /* =====================================================
       PAID PAYMENTS
    ===================================================== */

    const [[paidPayments]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM bookings
      WHERE payment_status = 'Paid'
    `);


    /* =====================================================
       AVAILABLE ROOMS
    ===================================================== */

    let availableRooms = 0;
    let totalRooms = 0;

    try {

      const [[rooms]] = await pool.query(`
        SELECT
          COUNT(*) AS total,
          SUM(
            CASE
              WHEN status = 'Available'
              THEN 1
              ELSE 0
            END
          ) AS available
        FROM rooms
      `);

      totalRooms = Number(
        rooms?.total || 0
      );

      availableRooms = Number(
        rooms?.available || 0
      );

    } catch (error) {

      /*
        If your project doesn't have a rooms
        table, don't crash the dashboard.
      */

      console.log(
        'Rooms statistics unavailable:',
        error.message
      );

    }


    /* =====================================================
       RECENT BOOKINGS
    ===================================================== */

    const [recentBookings] =
      await pool.query(`
        SELECT
          b.id,
          b.booking_ref,
          b.guest_name,
          b.guest_email,
          b.check_in,
          b.check_out,
          b.total_amount,
          b.status,
          b.payment_status,
          b.created_at,
          rt.name AS room_type_name
        FROM bookings b
        LEFT JOIN room_types rt
          ON rt.id = b.room_type_id
        ORDER BY b.created_at DESC
        LIMIT 10
      `);


    /* =====================================================
       RESPONSE
    ===================================================== */

    res.json({

      success: true,

      data: {

        totalBookings:
          Number(
            totalBookings?.total || 0
          ),

        todayBookings:
          Number(
            todayBookings?.total || 0
          ),

        pendingBookings:
          Number(
            pendingBookings?.total || 0
          ),

        confirmedBookings:
          Number(
            confirmedBookings?.total || 0
          ),

        cancelledBookings:
          Number(
            cancelledBookings?.total || 0
          ),

        completedBookings:
          Number(
            completedBookings?.total || 0
          ),

        totalCustomers:
          Number(
            totalCustomers?.total || 0
          ),

        todayCustomers:
          Number(
            todayCustomers?.total || 0
          ),

        totalRevenue:
          Number(
            totalRevenue?.total || 0
          ),

        todayRevenue:
          Number(
            todayRevenue?.total || 0
          ),

        pendingPayments:
          Number(
            pendingPayments?.total || 0
          ),

        paidPayments:
          Number(
            paidPayments?.total || 0
          ),

          pendingReviews:
  Number(pendingReviews?.total || 0),

activeOffers:
  Number(activeOffers?.total || 0),

        totalRooms,

        availableRooms,

        recentBookings,

      },

    });

  }
);