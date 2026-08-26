import { pool } from '../config/db.js';
import { asyncHandler } from '../utils/apiError.js';

/** GET /api/settings — public hotel info used across the site (name, contact, policies, etc.) */
export const getSettings = asyncHandler(async (req, res) => {
  const [[settings]] = await pool.query('SELECT * FROM hotel_settings WHERE id = 1');
  res.json({ success: true, data: settings || null });
});

/** GET /api/offers — active, currently-running offers for the Special Offers section */
export const listActiveOffers = asyncHandler(async (req, res) => {
  const [offers] = await pool.query(
    `SELECT o.*, rt.name AS room_type_name FROM offers o
     LEFT JOIN room_types rt ON rt.id = o.applicable_room_type_id
     WHERE o.status = 'Active' AND CURDATE() BETWEEN o.start_date AND o.end_date
       AND (o.max_usage IS NULL OR o.used_count < o.max_usage)
     ORDER BY o.end_date ASC`
  );
  res.json({ success: true, data: offers });
});

/** GET /api/gallery?category= — gallery images, optionally filtered by category */
export const listGallery = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const query = category
    ? { sql: 'SELECT * FROM gallery WHERE category = ? ORDER BY sort_order', params: [category] }
    : { sql: 'SELECT * FROM gallery ORDER BY sort_order', params: [] };
  const [images] = await pool.query(query.sql, query.params);
  res.json({ success: true, data: images });
});
