import { verifyToken } from '../utils/jwt.js';
import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';

/**
 * =========================================================
 * CUSTOMER AUTH
 * =========================================================
 */

export function requireCustomerAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : null;

    if (!token) {
      throw new ApiError(
        401,
        'Please log in to continue.'
      );
    }

    const payload = verifyToken(token);

    if (payload.type !== 'customer') {
      throw new ApiError(
        401,
        'Invalid customer session.'
      );
    }

    req.customer = payload;

    next();

  } catch (err) {

    if (err instanceof ApiError) {
      return next(err);
    }

    return next(
      new ApiError(
        401,
        'Your session has expired. Please log in again.'
      )
    );
  }
}


/**
 * =========================================================
 * OPTIONAL CUSTOMER AUTH
 * =========================================================
 *
 * Allows both logged-in and guest users.
 */

export function attachCustomerIfPresent(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : null;

    if (token) {
      const payload = verifyToken(token);

      if (payload.type === 'customer') {
        req.customer = payload;
      }
    }

  } catch {
    // Ignore invalid/expired token.
  }

  next();
}


/**
 * =========================================================
 * ADMIN AUTH
 * =========================================================
 */

export async function requireAdminAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : null;

    if (!token) {
      throw new ApiError(
        401,
        'Please log in as an administrator.'
      );
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new ApiError(401, 'Your admin session has expired. Please log in again.');
    }

    if (payload.type !== 'admin') {
      throw new ApiError(
        401,
        'Invalid admin session.'
      );
    }

    // Re-read from the DB so disabling an account or changing its role
    // takes effect immediately rather than when the JWT expires.
    const [[admin]] = await pool.query(
      'SELECT id, name, email, role, status FROM admins WHERE id = ?',
      [payload.id]
    );

    if (!admin || admin.status !== 'Active') {
      throw new ApiError(401, 'This admin account is no longer active.');
    }

    req.admin = admin;

    next();

  } catch (err) {
    next(err);
  }
}


/**
 * =========================================================
 * ROLE-BASED PERMISSIONS
 * =========================================================
 * Super Admin implicitly has every permission.
 * ponytail: fixed role set lives in code; move to roles/permissions tables
 * only if staff need to define custom roles at runtime.
 */

const MANAGER = 'Manager';
const RECEPTION = 'Receptionist';
const ACCOUNTS = 'Accountant';
const HOUSEKEEPING = 'Housekeeping';

export const PERMISSIONS = {
  'dashboard.view': [MANAGER, RECEPTION, ACCOUNTS],
  'bookings.view': [MANAGER, RECEPTION, ACCOUNTS],
  'bookings.manage': [MANAGER, RECEPTION],
  'payments.manage': [MANAGER, RECEPTION, ACCOUNTS],
  'rooms.view': [MANAGER, RECEPTION, HOUSEKEEPING],
  'rooms.status': [MANAGER, RECEPTION, HOUSEKEEPING],
  'rooms.manage': [MANAGER],
  'customers.view': [MANAGER, RECEPTION, ACCOUNTS],
  'customers.manage': [MANAGER],
  'content.manage': [MANAGER], // offers, reviews, gallery
  'settings.manage': [],
};

export function permissionsFor(role) {
  return Object.keys(PERMISSIONS).filter(
    (p) => role === 'Super Admin' || PERMISSIONS[p].includes(role)
  );
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.admin) {
      return next(new ApiError(401, 'Please log in as an administrator.'));
    }
    if (req.admin.role !== 'Super Admin' && !PERMISSIONS[permission]?.includes(req.admin.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
}


/**
 * =========================================================
 * AUDIT LOG
 * =========================================================
 * Records every successful admin write (who, what, which record) in
 * activity_logs. Request bodies are deliberately not stored — they can
 * hold passwords and guest PII.
 */

export function auditAdminWrites(req, res, next) {
  if (req.method === 'GET' || req.method === 'OPTIONS') return next();
  res.on('finish', () => {
    if (!req.admin || res.statusCode >= 400) return;
    const details = { status: res.statusCode, keys: Object.keys(req.body || {}) };
    pool.query(
      `INSERT INTO activity_logs (actor_type, actor_id, action, details) VALUES ('admin', ?, ?, ?)`,
      [req.admin.id, `${req.method} ${req.originalUrl.split('?')[0]}`, JSON.stringify(details)]
    ).catch((err) => console.error('[AUDIT] failed to write log:', err.message));
  });
  next();
}