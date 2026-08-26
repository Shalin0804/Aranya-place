import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';

/** GET /api/reviews — approved reviews only, newest first */
export const listApprovedReviews = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 12, 50);
  const [reviews] = await pool.query(
    `SELECT r.id, r.guest_name, r.rating, r.title, r.comment, r.created_at, rt.name AS room_type_name
     FROM reviews r LEFT JOIN room_types rt ON rt.id = r.room_type_id
     WHERE r.status = 'Approved'
     ORDER BY r.created_at DESC LIMIT ?`,
    [limit]
  );
  const [[{ avgRating, totalReviews }]] = await pool.query(
    `SELECT ROUND(AVG(rating), 1) AS avgRating, COUNT(*) AS totalReviews FROM reviews WHERE status = 'Approved'`
  );
  res.json({ success: true, data: { reviews, avgRating: avgRating || 0, totalReviews } });
});

/** POST /api/reviews — customer submits a review; goes to Pending until an admin approves it */
export const submitReview = asyncHandler(async (req, res) => {
  const { rating, title, comment, roomTypeId, guestName } = req.body;
  const numericRating = Number(rating);
  if (!numericRating || numericRating < 1 || numericRating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5.');
  }
  if (!comment || !comment.trim()) throw new ApiError(400, 'Please share a few words about your stay.');

  const name = req.customer ? undefined : guestName;
  if (!req.customer && (!name || !name.trim())) {
    throw new ApiError(400, 'Please enter your name.');
  }

  let finalName = name;
  if (req.customer) {
    const [[customer]] = await pool.query('SELECT name FROM customers WHERE id = ?', [req.customer.id]);
    finalName = customer.name;
  }

  await pool.query(
    `INSERT INTO reviews (customer_id, guest_name, rating, title, comment, room_type_id, status)
     VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
    [req.customer?.id || null, finalName.trim(), numericRating, title || null, comment.trim(), roomTypeId || null]
  );

  res.status(201).json({ success: true, message: 'Thank you! Your review is awaiting approval.' });
});
