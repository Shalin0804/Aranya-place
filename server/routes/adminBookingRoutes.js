import { Router } from 'express';

import {
  getAdminBookings,
  getAdminBookingById,
  updateBookingStatus,
  updatePaymentStatus,
  cancelAdminBooking,
} from '../controllers/adminBookingController.js';

import { requireAdminAuth } from '../middleware/auth.js';

const router = Router();

/*
|--------------------------------------------------------------------------
| Admin Booking Routes
|--------------------------------------------------------------------------
*/

router.get(
  '/',
  requireAdminAuth,
  getAdminBookings
);

router.get(
  '/:id',
  requireAdminAuth,
  getAdminBookingById
);

router.put(
  '/:id/status',
  requireAdminAuth,
  updateBookingStatus
);

router.put(
  '/:id/payment-status',
  requireAdminAuth,
  updatePaymentStatus
);

router.put(
  '/:id/cancel',
  requireAdminAuth,
  cancelAdminBooking
);

export default router;