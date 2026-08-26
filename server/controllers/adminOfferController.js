import { pool } from '../config/db.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';


/* =========================================================
   GET ALL OFFERS
========================================================= */

export const getAdminOffers = asyncHandler(async (req, res) => {
  const {
    status,
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
    conditions.push('o.status = ?');
    params.push(status);
  }

  if (search && search.trim()) {
    conditions.push(`
      (
        o.name LIKE ?
        OR o.description LIKE ?
      )
    `);

    const value = `%${search.trim()}%`;

    params.push(value, value);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';


  /* COUNT */

  const [[countResult]] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM offers o
    ${whereClause}
    `,
    params
  );


  /* DATA */

  const [offers] = await pool.query(
    `
    SELECT
      o.id,
      o.name,
      o.description,
      o.discount_type,
      o.discount_value,
      o.start_date,
      o.end_date,
      o.applicable_room_type_id,
      rt.name AS room_type_name,
      o.min_nights,
      o.max_usage,
      o.used_count,
      o.status,
      o.created_at
    FROM offers o
    LEFT JOIN room_types rt
      ON rt.id = o.applicable_room_type_id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
    `,
    [...params, limitNumber, offset]
  );


  res.json({
    success: true,
    data: {
      offers,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: Number(countResult.total || 0),
        totalPages: Math.ceil(
          Number(countResult.total || 0) /
          limitNumber
        ),
      },
    },
  });
});


/* =========================================================
   GET OFFER BY ID
========================================================= */

export const getAdminOfferById = asyncHandler(
  async (req, res) => {

    const [[offer]] = await pool.query(
      `
      SELECT
        o.id,
        o.name,
        o.description,
        o.discount_type,
        o.discount_value,
        o.start_date,
        o.end_date,
        o.applicable_room_type_id,
        rt.name AS room_type_name,
        o.min_nights,
        o.max_usage,
        o.used_count,
        o.status,
        o.created_at
      FROM offers o
      LEFT JOIN room_types rt
        ON rt.id = o.applicable_room_type_id
      WHERE o.id = ?
      `,
      [req.params.id]
    );

    if (!offer) {
      throw new ApiError(
        404,
        'Offer not found.'
      );
    }

    res.json({
      success: true,
      data: offer,
    });
  }
);


/* =========================================================
   CREATE OFFER
========================================================= */

export const createAdminOffer = asyncHandler(
  async (req, res) => {

    const {
      name,
      description,
      discount_type,
      discount_value,
      start_date,
      end_date,
      applicable_room_type_id,
      min_nights,
      max_usage,
      status,
    } = req.body;


    if (!name) {
      throw new ApiError(
        400,
        'Offer name is required.'
      );
    }

    if (
      !discount_type ||
      !['percentage', 'fixed'].includes(
        discount_type
      )
    ) {
      throw new ApiError(
        400,
        'Invalid discount type.'
      );
    }

    if (
      discount_value === undefined ||
      discount_value === null
    ) {
      throw new ApiError(
        400,
        'Discount value is required.'
      );
    }

    if (!start_date || !end_date) {
      throw new ApiError(
        400,
        'Start date and end date are required.'
      );
    }


    const [result] = await pool.query(
      `
      INSERT INTO offers
      (
        name,
        description,
        discount_type,
        discount_value,
        start_date,
        end_date,
        applicable_room_type_id,
        min_nights,
        max_usage,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        description || null,
        discount_type,
        Number(discount_value),
        start_date,
        end_date,
        applicable_room_type_id || null,
        Number(min_nights) || 1,
        max_usage || null,
        status === 'Inactive'
          ? 'Inactive'
          : 'Active',
      ]
    );


    const [[offer]] = await pool.query(
      `
      SELECT *
      FROM offers
      WHERE id = ?
      `,
      [result.insertId]
    );


    res.status(201).json({
      success: true,
      message: 'Offer created successfully.',
      data: offer,
    });
  }
);


/* =========================================================
   UPDATE OFFER
========================================================= */

export const updateAdminOffer = asyncHandler(
  async (req, res) => {

    const { id } = req.params;

    const {
      name,
      description,
      discount_type,
      discount_value,
      start_date,
      end_date,
      applicable_room_type_id,
      min_nights,
      max_usage,
      status,
    } = req.body;


    const [[existing]] = await pool.query(
      `
      SELECT id
      FROM offers
      WHERE id = ?
      `,
      [id]
    );

    if (!existing) {
      throw new ApiError(
        404,
        'Offer not found.'
      );
    }


    await pool.query(
      `
      UPDATE offers
      SET
        name = ?,
        description = ?,
        discount_type = ?,
        discount_value = ?,
        start_date = ?,
        end_date = ?,
        applicable_room_type_id = ?,
        min_nights = ?,
        max_usage = ?,
        status = ?
      WHERE id = ?
      `,
      [
        name,
        description || null,
        discount_type,
        Number(discount_value),
        start_date,
        end_date,
        applicable_room_type_id || null,
        Number(min_nights) || 1,
        max_usage || null,
        status === 'Inactive'
          ? 'Inactive'
          : 'Active',
        id,
      ]
    );


    const [[offer]] = await pool.query(
      `
      SELECT *
      FROM offers
      WHERE id = ?
      `,
      [id]
    );


    res.json({
      success: true,
      message: 'Offer updated successfully.',
      data: offer,
    });
  }
);


/* =========================================================
   DELETE OFFER
========================================================= */

export const deleteAdminOffer = asyncHandler(
  async (req, res) => {

    const { id } = req.params;

    const [[offer]] = await pool.query(
      `
      SELECT id
      FROM offers
      WHERE id = ?
      `,
      [id]
    );

    if (!offer) {
      throw new ApiError(
        404,
        'Offer not found.'
      );
    }


    await pool.query(
      `
      DELETE FROM offers
      WHERE id = ?
      `,
      [id]
    );


    res.json({
      success: true,
      message: 'Offer deleted successfully.',
    });
  }
);


/* =========================================================
   UPDATE OFFER STATUS
========================================================= */

export const updateOfferStatus = asyncHandler(
  async (req, res) => {

    const { id } = req.params;
    const { status } = req.body;


    if (
      !['Active', 'Inactive'].includes(status)
    ) {
      throw new ApiError(
        400,
        'Invalid offer status.'
      );
    }


    const [[offer]] = await pool.query(
      `
      SELECT id
      FROM offers
      WHERE id = ?
      `,
      [id]
    );

    if (!offer) {
      throw new ApiError(
        404,
        'Offer not found.'
      );
    }


    await pool.query(
      `
      UPDATE offers
      SET status = ?
      WHERE id = ?
      `,
      [status, id]
    );


    res.json({
      success: true,
      message: `Offer marked as ${status}.`,
    });
  }
);