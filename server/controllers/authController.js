import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { ApiError, asyncHandler } from '../utils/apiError.js';
import { signCustomerToken } from '../utils/jwt.js';

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

  await pool.query(
    'UPDATE customers SET name = ?, phone = ?, profile_image = ? WHERE id = ?',
    [name.trim(), phone || null, profile_image || null, req.customer.id]
  );

  const [[customer]] = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM customers WHERE id = ?`, [req.customer.id]);
  res.json({ success: true, data: customer });
});
