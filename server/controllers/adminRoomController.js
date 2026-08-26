import { pool } from '../config/db.js';

/* =========================================================
   GET ALL PHYSICAL ROOMS
   GET /api/admin/rooms
========================================================= */

export async function getAdminRooms(req, res, next) {
  try {
    const {
      search = '',
      status = 'all',
      roomTypeId = 'all',
    } = req.query;

    let where = [];
    let params = [];

    if (search.trim()) {
      where.push(`
        (
          r.room_number LIKE ?
          OR rt.name LIKE ?
        )
      `);

      const searchValue = `%${search.trim()}%`;

      params.push(
        searchValue,
        searchValue
      );
    }

    if (
      status &&
      status !== 'all'
    ) {
      where.push(`r.status = ?`);
      params.push(status);
    }

    if (
      roomTypeId &&
      roomTypeId !== 'all'
    ) {
      where.push(`r.room_type_id = ?`);
      params.push(roomTypeId);
    }

    const whereSql =
      where.length
        ? `WHERE ${where.join(' AND ')}`
        : '';

    const [rooms] =
      await pool.query(
        `
        SELECT
          r.id,
          r.room_number,
          r.room_type_id,
          rt.name AS room_type_name,
          rt.slug AS room_type_slug,
          rt.base_price,
          rt.max_guests,
          rt.bed_type,
          rt.size_sqft,
          r.floor,
          r.status,
          r.created_at

        FROM rooms r

        LEFT JOIN room_types rt
          ON rt.id = r.room_type_id

        ${whereSql}

        ORDER BY
          r.floor ASC,
          r.room_number ASC
        `,
        params
      );

    return res.json({
      success: true,
      data: rooms,
    });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   GET SINGLE PHYSICAL ROOM
   GET /api/admin/rooms/:id
========================================================= */

export async function getAdminRoomById(
  req,
  res,
  next
) {
  try {
    const { id } = req.params;

    const [[room]] =
      await pool.query(
        `
        SELECT
          r.id,
          r.room_number,
          r.room_type_id,
          rt.name AS room_type_name,
          rt.slug AS room_type_slug,
          rt.base_price,
          rt.max_guests,
          rt.bed_type,
          rt.size_sqft,
          r.floor,
          r.status,
          r.created_at

        FROM rooms r

        LEFT JOIN room_types rt
          ON rt.id = r.room_type_id

        WHERE r.id = ?
        `,
        [id]
      );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.',
      });
    }

    return res.json({
      success: true,
      data: room,
    });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   CREATE PHYSICAL ROOM
   POST /api/admin/rooms
========================================================= */

export async function createRoom(
  req,
  res,
  next
) {
  try {
    const {
      room_number,
      room_type_id,
      floor = 1,
      status = 'Available',
    } = req.body;

    if (!room_number) {
      return res.status(400).json({
        success: false,
        message: 'Room number is required.',
      });
    }

    if (!room_type_id) {
      return res.status(400).json({
        success: false,
        message: 'Room type is required.',
      });
    }

    const allowedStatuses = [
      'Available',
      'Occupied',
      'Reserved',
      'Maintenance',
      'Cleaning',
      'Out of Service',
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room status.',
      });
    }

    /* CHECK ROOM TYPE */

    const [[roomType]] =
      await pool.query(
        `
        SELECT id
        FROM room_types
        WHERE id = ?
        `,
        [room_type_id]
      );

    if (!roomType) {
      return res.status(400).json({
        success: false,
        message: 'Selected room type does not exist.',
      });
    }

    /* CHECK DUPLICATE ROOM NUMBER */

    const [[existingRoom]] =
      await pool.query(
        `
        SELECT id
        FROM rooms
        WHERE room_number = ?
        `,
        [room_number.trim()]
      );

    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: `Room ${room_number} already exists.`,
      });
    }

    const [result] =
      await pool.query(
        `
        INSERT INTO rooms
        (
          room_number,
          room_type_id,
          floor,
          status
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          room_number.trim(),
          Number(room_type_id),
          Number(floor) || 1,
          status,
        ]
      );

    const [[room]] =
      await pool.query(
        `
        SELECT
          r.id,
          r.room_number,
          r.room_type_id,
          rt.name AS room_type_name,
          rt.base_price,
          rt.max_guests,
          rt.bed_type,
          rt.size_sqft,
          r.floor,
          r.status,
          r.created_at

        FROM rooms r

        LEFT JOIN room_types rt
          ON rt.id = r.room_type_id

        WHERE r.id = ?
        `,
        [result.insertId]
      );

    return res.status(201).json({
      success: true,
      message: 'Room created successfully.',
      data: room,
    });

  } catch (error) {

    /* MYSQL DUPLICATE KEY */

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A room with this number already exists.',
      });
    }

    next(error);
  }
}


/* =========================================================
   UPDATE PHYSICAL ROOM
   PUT /api/admin/rooms/:id
========================================================= */

export async function updateRoom(
  req,
  res,
  next
) {
  try {
    const { id } = req.params;

    const {
      room_number,
      room_type_id,
      floor,
      status,
    } = req.body;

    const [[existingRoom]] =
      await pool.query(
        `
        SELECT id
        FROM rooms
        WHERE id = ?
        `,
        [id]
      );

    if (!existingRoom) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.',
      });
    }

    if (!room_number) {
      return res.status(400).json({
        success: false,
        message: 'Room number is required.',
      });
    }

    if (!room_type_id) {
      return res.status(400).json({
        success: false,
        message: 'Room type is required.',
      });
    }

    const allowedStatuses = [
      'Available',
      'Occupied',
      'Reserved',
      'Maintenance',
      'Cleaning',
      'Out of Service',
    ];

    if (
      status &&
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room status.',
      });
    }

    const [[roomType]] =
      await pool.query(
        `
        SELECT id
        FROM room_types
        WHERE id = ?
        `,
        [room_type_id]
      );

    if (!roomType) {
      return res.status(400).json({
        success: false,
        message: 'Selected room type does not exist.',
      });
    }

    /* CHECK DUPLICATE ROOM NUMBER */

    const [[duplicate]] =
      await pool.query(
        `
        SELECT id
        FROM rooms
        WHERE room_number = ?
        AND id != ?
        `,
        [
          room_number.trim(),
          id,
        ]
      );

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Room ${room_number} already exists.`,
      });
    }

    await pool.query(
      `
      UPDATE rooms

      SET
        room_number = ?,
        room_type_id = ?,
        floor = ?,
        status = ?

      WHERE id = ?
      `,
      [
        room_number.trim(),
        Number(room_type_id),
        Number(floor) || 1,
        status || 'Available',
        id,
      ]
    );

    const [[room]] =
      await pool.query(
        `
        SELECT
          r.id,
          r.room_number,
          r.room_type_id,
          rt.name AS room_type_name,
          rt.base_price,
          rt.max_guests,
          rt.bed_type,
          rt.size_sqft,
          r.floor,
          r.status,
          r.created_at

        FROM rooms r

        LEFT JOIN room_types rt
          ON rt.id = r.room_type_id

        WHERE r.id = ?
        `,
        [id]
      );

    return res.json({
      success: true,
      message: 'Room updated successfully.',
      data: room,
    });

  } catch (error) {

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A room with this number already exists.',
      });
    }

    next(error);
  }
}


/* =========================================================
   UPDATE ROOM STATUS
   PUT /api/admin/rooms/:id/status
========================================================= */

export async function updateRoomStatus(
  req,
  res,
  next
) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      'Available',
      'Occupied',
      'Reserved',
      'Maintenance',
      'Cleaning',
      'Out of Service',
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room status.',
      });
    }

    const [result] =
      await pool.query(
        `
        UPDATE rooms
        SET status = ?
        WHERE id = ?
        `,
        [
          status,
          id,
        ]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Room status updated successfully.',
    });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   DELETE PHYSICAL ROOM
   DELETE /api/admin/rooms/:id
========================================================= */

export async function deleteRoom(
  req,
  res,
  next
) {
  try {
    const { id } = req.params;

    const [[room]] =
      await pool.query(
        `
        SELECT
          id,
          room_number
        FROM rooms
        WHERE id = ?
        `,
        [id]
      );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.',
      });
    }

    await pool.query(
      `
      DELETE FROM rooms
      WHERE id = ?
      `,
      [id]
    );

    return res.json({
      success: true,
      message: `Room ${room.room_number} deleted successfully.`,
    });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   GET ROOM TYPES FOR ADMIN
   GET /api/admin/rooms/room-types
========================================================= */

export async function getRoomTypesForAdmin(
  req,
  res,
  next
) {
  try {
    const [roomTypes] =
      await pool.query(
        `
        SELECT
          id,
          name,
          slug,
          tagline,
          description,
          base_price,
          max_guests,
          bed_type,
          size_sqft,
          sort_order,
          created_at

        FROM room_types

        ORDER BY
          sort_order ASC,
          name ASC
        `
      );

    return res.json({
      success: true,
      data: roomTypes,
    });

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   CREATE ROOM TYPE
   POST /api/admin/rooms/room-types
========================================================= */

export async function createRoomType(req, res, next) {
  try {
    const {
      name,
      slug,
      tagline = '',
      description = '',
      base_price,
      max_guests,
      bed_type,
      size_sqft,
      sort_order = 0,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required.',
      });
    }

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Slug is required.',
      });
    }

    if (!base_price) {
      return res.status(400).json({
        success: false,
        message: 'Base price is required.',
      });
    }

    if (!bed_type) {
      return res.status(400).json({
        success: false,
        message: 'Bed type is required.',
      });
    }

    if (!size_sqft) {
      return res.status(400).json({
        success: false,
        message: 'Room size is required.',
      });
    }

    const [[existing]] = await pool.query(
      `SELECT id FROM room_types WHERE slug = ?`,
      [slug.trim()]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A room type with slug "${slug}" already exists.`,
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO room_types
      (name, slug, tagline, description, base_price, max_guests, bed_type, size_sqft, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name.trim(),
        slug.trim(),
        tagline?.trim() || null,
        description?.trim() || null,
        Number(base_price),
        Number(max_guests) || 2,
        bed_type.trim(),
        Number(size_sqft),
        Number(sort_order) || 0,
      ]
    );

    const [[roomType]] = await pool.query(
      `SELECT * FROM room_types WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Room type created successfully.',
      data: roomType,
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A room type with this slug already exists.',
      });
    }
    next(error);
  }
}


/* =========================================================
   UPDATE ROOM TYPE
   PUT /api/admin/rooms/room-types/:id
========================================================= */

export async function updateRoomType(req, res, next) {
  try {
    const { id } = req.params;

    const {
      name,
      slug,
      tagline = '',
      description = '',
      base_price,
      max_guests,
      bed_type,
      size_sqft,
      sort_order = 0,
    } = req.body;

    const [[existing]] = await pool.query(
      `SELECT id FROM room_types WHERE id = ?`,
      [id]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Room type not found.',
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required.',
      });
    }

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Slug is required.',
      });
    }

    if (!base_price) {
      return res.status(400).json({
        success: false,
        message: 'Base price is required.',
      });
    }

    if (!bed_type) {
      return res.status(400).json({
        success: false,
        message: 'Bed type is required.',
      });
    }

    if (!size_sqft) {
      return res.status(400).json({
        success: false,
        message: 'Room size is required.',
      });
    }

    const [[duplicate]] = await pool.query(
      `SELECT id FROM room_types WHERE slug = ? AND id != ?`,
      [slug.trim(), id]
    );

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `A room type with slug "${slug}" already exists.`,
      });
    }

    await pool.query(
      `
      UPDATE room_types
      SET
        name = ?,
        slug = ?,
        tagline = ?,
        description = ?,
        base_price = ?,
        max_guests = ?,
        bed_type = ?,
        size_sqft = ?,
        sort_order = ?
      WHERE id = ?
      `,
      [
        name.trim(),
        slug.trim(),
        tagline?.trim() || null,
        description?.trim() || null,
        Number(base_price),
        Number(max_guests) || 2,
        bed_type.trim(),
        Number(size_sqft),
        Number(sort_order) || 0,
        id,
      ]
    );

    const [[roomType]] = await pool.query(
      `SELECT * FROM room_types WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'Room type updated successfully.',
      data: roomType,
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A room type with this slug already exists.',
      });
    }
    next(error);
  }
}


/* =========================================================
   DELETE ROOM TYPE
   DELETE /api/admin/rooms/room-types/:id
========================================================= */

export async function deleteRoomType(req, res, next) {
  try {
    const { id } = req.params;

    const [[roomType]] = await pool.query(
      `SELECT id, name FROM room_types WHERE id = ?`,
      [id]
    );

    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: 'Room type not found.',
      });
    }

    const [[{ count: roomCount }]] = await pool.query(
      `SELECT COUNT(*) AS count FROM rooms WHERE room_type_id = ?`,
      [id]
    );

    if (roomCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete "${roomType.name}" — ${roomCount} physical room(s) still use this room type. Reassign or delete those rooms first.`,
      });
    }

    const [[{ count: bookingCount }]] = await pool.query(
      `SELECT COUNT(*) AS count FROM bookings WHERE room_type_id = ?`,
      [id]
    );

    if (bookingCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete "${roomType.name}" — it has existing bookings on record.`,
      });
    }

    await pool.query(`DELETE FROM room_types WHERE id = ?`, [id]);

    return res.json({
      success: true,
      message: `Room type "${roomType.name}" deleted successfully.`,
    });

  } catch (error) {
    next(error);
  }
}