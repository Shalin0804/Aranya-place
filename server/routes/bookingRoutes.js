import { Router } from 'express';
import {
  createBooking, getBookingByRef, cancelBookingByRef, getMyBookings, cancelBooking, searchAvailability,
} from '../controllers/bookingController.js';
import { requireCustomerAuth, attachCustomerIfPresent } from '../middleware/auth.js';
import { bookingLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.get('/availability', searchAvailability);
router.get('/me', requireCustomerAuth, getMyBookings);
router.get('/ref/:bookingRef', bookingLimiter, attachCustomerIfPresent, getBookingByRef);
router.put('/ref/:bookingRef/cancel', bookingLimiter, attachCustomerIfPresent, cancelBookingByRef);
router.post('/', bookingLimiter, attachCustomerIfPresent, createBooking);
router.put('/:id/cancel', requireCustomerAuth, cancelBooking);

export default router;
