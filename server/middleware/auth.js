import { verifyToken } from '../utils/jwt.js';
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

export function requireAdminAuth(req, res, next) {
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

    const payload = verifyToken(token);

    if (payload.type !== 'admin') {
      throw new ApiError(
        401,
        'Invalid admin session.'
      );
    }

    req.admin = payload;

    next();

  } catch (err) {

    if (err instanceof ApiError) {
      return next(err);
    }

    return next(
      new ApiError(
        401,
        'Your admin session has expired. Please log in again.'
      )
    );
  }
}