import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';
import { signCustomerToken } from '../utils/jwt.js';
import { sendEmail } from '../utils/email.js';

const PUBLIC_FIELDS = 'id, name, email, phone, profile_image, status, created_at';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !name.trim()) throw new ApiError(400, 'Please enter your full name.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, 'Please enter a valid email address.');
  }
  if (!password || password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters.');
  }

  const [existing] = await pool.query('SELECT id FROM customers WHERE email = ?', [email.toLowerCase()]);
  if (existing.length > 0) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    'INSERT INTO customers (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
    [name.trim(), email.toLowerCase(), phone || null, passwordHash]
  );

  const [[customer]] = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM customers WHERE id = ?`, [result.insertId]);
  const token = signCustomerToken(customer);

  res.status(201).json({ success: true, data: { customer, token } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Please enter your email and password.');

  const [[customer]] = await pool.query('SELECT * FROM customers WHERE email = ?', [email.toLowerCase()]);
  if (!customer) throw new ApiError(401, 'Invalid email or password.');
  if (customer.status === 'Disabled') throw new ApiError(403, 'This account has been disabled.');

  const valid = await bcrypt.compare(password, customer.password_hash);
  if (!valid) throw new ApiError(401, 'Invalid email or password.');

  delete customer.password_hash;
  const token = signCustomerToken(customer);
  res.json({ success: true, data: { customer, token } });
});

export const getProfile = asyncHandler(async (req, res) => {
  const [[customer]] = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM customers WHERE id = ?`, [req.customer.id]);
  if (!customer) throw new ApiError(404, 'Account not found.');
  res.json({ success: true, data: customer });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, profile_image } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, 'Name cannot be empty.');
  // The profile phone is copied onto every booking, so validate it here.
  if (phone && !/^\+?[\d\s()-]{7,20}$/.test(String(phone).trim())) {
    throw new ApiError(400, 'Please enter a valid mobile number.');
  }

  // profile_image is only changed when the client sends it.
  await pool.query(
    'UPDATE customers SET name = ?, phone = ?, profile_image = COALESCE(?, profile_image) WHERE id = ?',
    [name.trim(), phone ? String(phone).trim() : null, profile_image || null, req.customer.id]
  );

  const [[customer]] = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM customers WHERE id = ?`, [req.customer.id]);
  res.json({ success: true, data: customer });
});

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');
const RESET_TTL_MINUTES = 60;

/**
 * POST /api/auth/forgot-password { email }
 * Always answers the same way, so it can't be used to find out which
 * emails have accounts. Only a hash of the token is stored.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const [[customer]] = await pool.query(
    "SELECT id, name, email FROM customers WHERE email = ? AND status = 'Active'",
    [email]
  );
  if (customer) {
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'UPDATE customers SET password_reset_hash = ?, password_reset_expires = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?',
      [sha256(token), RESET_TTL_MINUTES, customer.id]
    );
    sendEmail('passwordReset', { ...customer, token, minutes: RESET_TTL_MINUTES });
  }
  res.json({ success: true, message: 'If an account exists for that email, a reset link has been sent.' });
});

/** POST /api/auth/reset-password { token, password } */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) {
    throw new ApiError(400, 'This reset link is invalid or has expired.');
  }
  if (!password || password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters.');

  const [[customer]] = await pool.query(
    "SELECT id FROM customers WHERE password_reset_hash = ? AND password_reset_expires > NOW() AND status = 'Active'",
    [sha256(token)]
  );
  if (!customer) throw new ApiError(400, 'This reset link is invalid or has expired.');

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    'UPDATE customers SET password_hash = ?, password_reset_hash = NULL, password_reset_expires = NULL WHERE id = ?',
    [passwordHash, customer.id]
  );
  res.json({ success: true, message: 'Your password has been reset. Please sign in.' });
});
