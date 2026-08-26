import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';

export const getAdminReviews = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const params = [];
  let where = '';

  if (status && status !== 'all') {
    where = 'WHERE r.status = ?';
    params.push(status);
  }

  const [reviews] = await pool.query(
    `
    SELECT
      r.*,
      rt.name AS room_type_name,
      c.email AS customer_email
    FROM reviews r
    LEFT JOIN room_types rt
      ON rt.id = r.room_type_id
    LEFT JOIN customers c
      ON c.id = r.customer_id
    ${where}
    ORDER BY r.created_at DESC
    `,
    params
  );

  res.json({
    success: true,
    data: reviews,
  });
});

export const updateReviewStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
    throw new ApiError(400, 'Invalid review status.');
  }

  const [result] = await pool.query(
    `
    UPDATE reviews
    SET status = ?
    WHERE id = ?
    `,
    [status, req.params.id]
  );

  if (!result.affectedRows) {
    throw new ApiError(404, 'Review not found.');
  }

  res.json({
    success: true,
    message: `Review ${status.toLowerCase()}.`,
  });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'DELETE FROM reviews WHERE id = ?',
    [req.params.id]
  );

  if (!result.affectedRows) {
    throw new ApiError(404, 'Review not found.');
  }

  res.json({
    success: true,
    message: 'Review deleted successfully.',
  });
});