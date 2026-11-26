import { Router } from 'express';

import {
  adminLogin,
  getAdminProfile,
} from '../controllers/adminAuthController.js';

import { requireAdminAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.post('/login', authLimiter, adminLogin);

router.get('/me', requireAdminAuth, getAdminProfile);

export default router;
