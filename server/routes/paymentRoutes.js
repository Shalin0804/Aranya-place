import { Router } from 'express';
import { getPaymentConfig, createOrder, verifyPayment } from '../controllers/paymentController.js';
import { requireCustomerAuth } from '../middleware/auth.js';
import { bookingLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.get('/config', getPaymentConfig);
router.post('/order', bookingLimiter, requireCustomerAuth, createOrder);
router.post('/verify', bookingLimiter, verifyPayment);

export default router;
