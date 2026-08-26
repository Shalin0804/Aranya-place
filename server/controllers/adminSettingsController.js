import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';

export const getAdminSettings = asyncHandler(async (req, res) => {
  const [[settings]] = await pool.query(
    'SELECT * FROM hotel_settings WHERE id = 1'
  );

  if (!settings) {
    throw new ApiError(404, 'Hotel settings not found.');
  }

  res.json({
    success: true,
    data: settings,
  });
});

export const updateAdminSettings = asyncHandler(async (req, res) => {
  const fields = Object.keys(req.body);

  if (!fields.length) {
    throw new ApiError(400, 'No settings were provided.');
  }

  const allowedFields = [
    'hotel_name',
    'tagline',
    'address',
    'phone',
    'email',
    'website',
    'tax_percentage',
    'check_in_time',
    'check_out_time',
    'cancellation_policy',
  ];

  const updates = [];
  const values = [];

  for (const field of fields) {
    if (!allowedFields.includes(field)) continue;

    updates.push(`\`${field}\` = ?`);
    values.push(req.body[field]);
  }

  if (!updates.length) {
    throw new ApiError(400, 'No valid settings were provided.');
  }

  values.push(1);

  await pool.query(
    `
    UPDATE hotel_settings
    SET ${updates.join(', ')}
    WHERE id = ?
    `,
    values
  );

  const [[settings]] = await pool.query(
    'SELECT * FROM hotel_settings WHERE id = 1'
  );

  res.json({
    success: true,
    message: 'Hotel settings updated successfully.',
    data: settings,
  });
});