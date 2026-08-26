import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';

export function requireAdminAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';

    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : null;

    if (!token) {
      throw new ApiError(401, 'Administrator authentication required.');
    }

    const payload = verifyToken(token);

    if (payload.type !== 'admin') {
      throw new ApiError(401, 'Invalid administrator session.');
    }

    req.admin = payload;

    next();
  } catch (err) {
    if (err instanceof ApiError) {
      return next(err);
    }

    next(new ApiError(401, 'Your administrator session has expired.'));
  }
}

export function requireAdminRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.admin) {
      return next(
        new ApiError(401, 'Administrator authentication required.')
      );
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return next(
        new ApiError(
          403,
          'You do not have permission to perform this action.'
        )
      );
    }

    next();
  };
}