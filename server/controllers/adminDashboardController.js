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

    // Tonight's occupancy from actual bookings, in hotel (IST) dates.
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const monthStart = `${today.slice(0, 8)}01`;

    const [[rooms]] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status NOT IN ('Maintenance', 'Out of Service')) AS usable,
        SUM(status IN ('Maintenance', 'Out of Service')) AS outOfOrder
      FROM rooms
    `);
    const totalRooms = Number(rooms?.total || 0);
    const usableRooms = Number(rooms?.usable || 0);

    const [[ops]] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN check_in <= ? AND check_out > ? THEN num_rooms END), 0) AS occupied,
         COALESCE(SUM(CASE WHEN check_in = ? AND status = 'Confirmed' THEN 1 END), 0) AS arrivals,
         COALESCE(SUM(CASE WHEN check_out = ? AND status = 'Checked In' THEN 1 END), 0) AS departures,
         COALESCE(SUM(CASE WHEN check_in = ? THEN 1 END), 0) AS checkInsToday,
         COALESCE(SUM(CASE WHEN check_out = ? THEN 1 END), 0) AS checkOutsToday
       FROM bookings
       WHERE status IN ('Pending', 'Confirmed', 'Checked In', 'Checked Out')`,
      [today, today, today, today, today, today]
    );
    const occupiedRooms = Math.min(Number(ops.occupied), usableRooms);
    const availableRooms = Math.max(usableRooms - occupiedRooms, 0);

    const [[revenue]] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(?, INTERVAL 6 DAY) THEN total_amount END), 0) AS week,
         COALESCE(SUM(CASE WHEN created_at >= ? THEN total_amount END), 0) AS month
       FROM bookings WHERE payment_status = 'Paid' AND status != 'Cancelled'`,
      [today, monthStart]
    );

    const [[guestBookings]] = await pool.query(
      'SELECT COUNT(*) AS total FROM bookings WHERE customer_id IS NULL'
    );


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

        occupiedRooms,

        outOfOrderRooms: Number(rooms?.outOfOrder || 0),

        occupancyRate: usableRooms ? Math.round((occupiedRooms / usableRooms) * 100) : 0,

        todayCheckIns: Number(ops.checkInsToday),

        todayCheckOuts: Number(ops.checkOutsToday),

        pendingArrivals: Number(ops.arrivals),

        pendingDepartures: Number(ops.departures),

        weekRevenue: Number(revenue.week),

        monthRevenue: Number(revenue.month),

        guestBookings: Number(guestBookings.total),

        recentBookings,

      },

    });

  }
);