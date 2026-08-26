import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import { requireCustomerAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', requireCustomerAuth, getProfile);
router.put('/me', requireCustomerAuth, updateProfile);

export default router;
