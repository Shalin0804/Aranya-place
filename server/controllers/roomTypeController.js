import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';
import { getAvailableRoomCount, validateDateRange } from '../utils/booking.js';

async function attachRelations(roomType) {
  const [amenities] = await pool.query(
    'SELECT amenity FROM room_type_amenities WHERE room_type_id = ?',
    [roomType.id]
  );
  const [images] = await pool.query(
    'SELECT image_url, is_featured FROM room_type_images WHERE room_type_id = ? ORDER BY sort_order',
    [roomType.id]
  );
  return {
    ...roomType,
    amenities: amenities.map((a) => a.amenity),
    images: images.map((i) => i.image_url),
  };
}

/** GET /api/room-types  — optionally ?checkIn=&checkOut=&guests= to compute live availability */
export const listRoomTypes = asyncHandler(async (req, res) => {
  const { checkIn, checkOut, guests } = req.query;
  const [roomTypes] = await pool.query('SELECT * FROM room_types ORDER BY sort_order, base_price');

  const withRelations = await Promise.all(roomTypes.map(attachRelations));

  let results = withRelations;
  if (guests) {
    results = results.filter((rt) => rt.max_guests >= Number(guests));
  }

  if (checkIn && checkOut) {
    validateDateRange(checkIn, checkOut);
    results = await Promise.all(
      results.map(async (rt) => ({
        ...rt,
        availableRooms: await getAvailableRoomCount(rt.id, checkIn, checkOut),
      }))
    );
  } else {
    results = await Promise.all(
      results.map(async (rt) => {
        const [[{ total }]] = await pool.query(
          "SELECT COUNT(*) AS total FROM rooms WHERE room_type_id = ? AND status NOT IN ('Maintenance','Out of Service')",
          [rt.id]
        );
        return { ...rt, availableRooms: total };
      })
    );
  }

  res.json({ success: true, data: results });
});

/** GET /api/room-types/:slug */
export const getRoomTypeBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { checkIn, checkOut } = req.query;

  const [[roomType]] = await pool.query('SELECT * FROM room_types WHERE slug = ?', [slug]);
  if (!roomType) throw new ApiError(404, 'We could not find that room.');

  const full = await attachRelations(roomType);

  if (checkIn && checkOut) {
    validateDateRange(checkIn, checkOut);
    full.availableRooms = await getAvailableRoomCount(roomType.id, checkIn, checkOut);
  } else {
    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM rooms WHERE room_type_id = ? AND status NOT IN ('Maintenance','Out of Service')",
      [roomType.id]
    );
    full.availableRooms = total;
  }

  const [reviews] = await pool.query(
    `SELECT r.id, r.guest_name, r.rating, r.title, r.comment, r.created_at
     FROM reviews r WHERE r.room_type_id = ? AND r.status = 'Approved'
     ORDER BY r.created_at DESC LIMIT 6`,
    [roomType.id]
  );
  full.reviews = reviews;

  res.json({ success: true, data: full });
});
