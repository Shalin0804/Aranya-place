import { Router } from 'express';

import {
  getAdminBookings,
  getAdminBookingById,
  updateBookingStatus,
  updatePaymentStatus,
  cancelAdminBooking,
} from '../controllers/adminBookingController.js';

import { requireAdminAuth, requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(requireAdminAuth);

router.get('/', requirePermission('bookings.view'), getAdminBookings);
router.get('/:id', requirePermission('bookings.view'), getAdminBookingById);
router.put('/:id/status', requirePermission('bookings.manage'), updateBookingStatus);
router.put('/:id/payment-status', requirePermission('payments.manage'), updatePaymentStatus);
router.put('/:id/cancel', requirePermission('bookings.manage'), cancelAdminBooking);

export default router;
