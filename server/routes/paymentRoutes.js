import { Router } from 'express';
import { getPaymentConfig, createOrder, verifyPayment } from '../controllers/paymentController.js';
import { attachCustomerIfPresent } from '../middleware/auth.js';
import { bookingLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.get('/config', getPaymentConfig);
router.post('/order', bookingLimiter, attachCustomerIfPresent, createOrder);
router.post('/verify', bookingLimiter, verifyPayment);

export default router;
