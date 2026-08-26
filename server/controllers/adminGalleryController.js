import { pool } from '../config/db.js';
import { asyncHandler, ApiError } from '../utils/apiError.js';


/* =========================================================
   GET GALLERY
========================================================= */

export const getAdminGallery = asyncHandler(
  async (req, res) => {

    const {
      category,
      featured,
    } = req.query;

    const conditions = [];
    const params = [];

    if (
      category &&
      category !== 'all'
    ) {
      conditions.push(
        'category = ?'
      );

      params.push(category);
    }

    if (
      featured !== undefined &&
      featured !== ''
    ) {
      conditions.push(
        'is_featured = ?'
      );

      params.push(
        featured === 'true' ||
        featured === '1'
          ? 1
          : 0
      );
    }

    const whereClause =
      conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';


    const [gallery] =
      await pool.query(
        `
        SELECT
          id,
          category,
          image_url,
          caption,
          sort_order,
          is_featured,
          created_at
        FROM gallery
        ${whereClause}
        ORDER BY sort_order ASC, id DESC
        `,
        params
      );


    res.json({
      success: true,
      data: {
        gallery,
      },
    });
  }
);


/* =========================================================
   GET SINGLE IMAGE
========================================================= */

export const getAdminGalleryItem =
  asyncHandler(async (req, res) => {

    const [[image]] =
      await pool.query(
        `
        SELECT *
        FROM gallery
        WHERE id = ?
        `,
        [req.params.id]
      );

    if (!image) {
      throw new ApiError(
        404,
        'Gallery image not found.'
      );
    }

    res.json({
      success: true,
      data: image,
    });
  });


/* =========================================================
   CREATE IMAGE
========================================================= */

export const createGalleryImage =
  asyncHandler(async (req, res) => {

    const {
      category,
      caption,
      sort_order,
      is_featured,
    } = req.body;


    const allowedCategories = [
      'hotel',
      'room',
      'restaurant',
      'pool',
      'facility',
      'event',
    ];


    if (
      !allowedCategories.includes(category)
    ) {
      throw new ApiError(
        400,
        'Invalid gallery category.'
      );
    }


    if (!req.file) {
      throw new ApiError(
        400,
        'Image file is required.'
      );
    }

    const image_url =
      `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;


    const [result] =
      await pool.query(
        `
        INSERT INTO gallery
        (
          category,
          image_url,
          caption,
          sort_order,
          is_featured
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          category,
          image_url,
          caption || null,
          Number(sort_order) || 0,
          is_featured ? 1 : 0,
        ]
      );


    const [[image]] =
      await pool.query(
        `
        SELECT *
        FROM gallery
        WHERE id = ?
        `,
        [result.insertId]
      );


    res.status(201).json({
      success: true,
      message: 'Gallery image added successfully.',
      data: image,
    });
  });


/* =========================================================
   UPDATE IMAGE
========================================================= */

export const updateGalleryImage =
  asyncHandler(async (req, res) => {

    const { id } = req.params;

    const {
      category,
      caption,
      sort_order,
      is_featured,
    } = req.body;


    const [[existing]] =
      await pool.query(
        `
        SELECT id, image_url
        FROM gallery
        WHERE id = ?
        `,
        [id]
      );


    if (!existing) {
      throw new ApiError(
        404,
        'Gallery image not found.'
      );
    }

    const image_url =
      req.file
        ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
        : existing.image_url;


    await pool.query(
      `
      UPDATE gallery
      SET
        category = ?,
        image_url = ?,
        caption = ?,
        sort_order = ?,
        is_featured = ?
      WHERE id = ?
      `,
      [
        category,
        image_url,
        caption || null,
        Number(sort_order) || 0,
        is_featured ? 1 : 0,
        id,
      ]
    );


    const [[image]] =
      await pool.query(
        `
        SELECT *
        FROM gallery
        WHERE id = ?
        `,
        [id]
      );


    res.json({
      success: true,
      message: 'Gallery image updated successfully.',
      data: image,
    });
  });


/* =========================================================
   DELETE IMAGE
========================================================= */

export const deleteGalleryImage =
  asyncHandler(async (req, res) => {

    const { id } = req.params;


    const [[existing]] =
      await pool.query(
        `
        SELECT id
        FROM gallery
        WHERE id = ?
        `,
        [id]
      );


    if (!existing) {
      throw new ApiError(
        404,
        'Gallery image not found.'
      );
    }


    await pool.query(
      `
      DELETE FROM gallery
      WHERE id = ?
      `,
      [id]
    );


    res.json({
      success: true,
      message: 'Gallery image deleted successfully.',
    });
  });