import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';
import { signAdminToken } from '../utils/jwt.js';
import { permissionsFor } from '../middleware/auth.js';

const ADMIN_FIELDS = `
  id,
  name,
  email,
  role,
  status,
  created_at
`;

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const [[admin]] = await pool.query(
    'SELECT * FROM admins WHERE email = ?',
    [email.toLowerCase().trim()]
  );

  if (!admin) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (admin.status !== 'Active') {
    throw new ApiError(403, 'This admin account has been disabled.');
  }

  const validPassword = await bcrypt.compare(
    password,
    admin.password_hash
  );

  if (!validPassword) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const [[safeAdmin]] = await pool.query(
    `SELECT ${ADMIN_FIELDS} FROM admins WHERE id = ?`,
    [admin.id]
  );

  const token = signAdminToken(safeAdmin);

  res.json({
    success: true,
    data: {
      admin: { ...safeAdmin, permissions: permissionsFor(safeAdmin.role) },
      token,
    },
  });
});

export const getAdminProfile = asyncHandler(async (req, res) => {
  const [[admin]] = await pool.query(
    `SELECT ${ADMIN_FIELDS} FROM admins WHERE id = ?`,
    [req.admin.id]
  );

  if (!admin) {
    throw new ApiError(404, 'Admin account not found.');
  }

  if (admin.status !== 'Active') {
    throw new ApiError(403, 'Admin account is disabled.');
  }

  res.json({
    success: true,
    data: { ...admin, permissions: permissionsFor(admin.role) },
  });
});