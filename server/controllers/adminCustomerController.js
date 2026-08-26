import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';

export const getAdminCustomers = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  const conditions = [];
  const params = [];

  if (status && status !== 'all') {
    conditions.push('c.status = ?');
    params.push(status);
  }

  if (search?.trim()) {
    conditions.push(`
      (
        c.name LIKE ? OR
        c.email LIKE ? OR
        c.phone LIKE ?
      )
    `);

    const value = `%${search.trim()}%`;
    params.push(value, value, value);
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const [customers] = await pool.query(
    `
    SELECT
      c.id,
      c.name,
      c.email,
      c.phone,
      c.profile_image,
      c.status,
      c.created_at,
      COUNT(b.id) AS total_bookings,
      COALESCE(SUM(
        CASE
          WHEN b.status != 'Cancelled'
          THEN b.total_amount
          ELSE 0
        END
      ), 0) AS total_spent
    FROM customers c
    LEFT JOIN bookings b ON b.customer_id = c.id
    ${where}
    GROUP BY c.id
    ORDER BY c.created_at DESC
    `,
    params
  );

  res.json({
    success: true,
    data: customers,
  });
});

export const getAdminCustomerById = asyncHandler(async (req, res) => {
  const [[customer]] = await pool.query(
    `
    SELECT
      id, name, email, phone,
      profile_image, status, created_at
    FROM customers
    WHERE id = ?
    `,
    [req.params.id]
  );

  if (!customer) {
    throw new ApiError(404, 'Customer not found.');
  }

  const [bookings] = await pool.query(
    `
    SELECT
      b.*,
      rt.name AS room_type_name
    FROM bookings b
    LEFT JOIN room_types rt
      ON rt.id = b.room_type_id
    WHERE b.customer_id = ?
    ORDER BY b.created_at DESC
    `,
    [req.params.id]
  );

  res.json({
    success: true,
    data: {
      customer,
      bookings,
    },
  });
});

export const updateCustomerStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['Active', 'Disabled'].includes(status)) {
    throw new ApiError(400, 'Invalid customer status.');
  }

  const [result] = await pool.query(
    `
    UPDATE customers
    SET status = ?
    WHERE id = ?
    `,
    [status, req.params.id]
  );

  if (!result.affectedRows) {
    throw new ApiError(404, 'Customer not found.');
  }

  res.json({
    success: true,
    message: `Customer ${status.toLowerCase()} successfully.`,
  });
});