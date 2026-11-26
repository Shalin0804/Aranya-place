import { Router } from 'express';
import {
  createBooking, getBookingByRef, cancelBookingByRef, getMyBookings, cancelBooking, searchAvailability,
} from '../controllers/bookingController.js';
import { requireCustomerAuth } from '../middleware/auth.js';
import { bookingLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.get('/availability', searchAvailability);
router.get('/me', requireCustomerAuth, getMyBookings);
// All booking actions require a signed-in customer account (no guest checkout).
router.get('/ref/:bookingRef', requireCustomerAuth, getBookingByRef);
router.put('/ref/:bookingRef/cancel', requireCustomerAuth, cancelBookingByRef);
router.post('/', bookingLimiter, requireCustomerAuth, createBooking);
router.put('/:id/cancel', requireCustomerAuth, cancelBooking);

export default router;
