import { Router } from 'express';

import {
  adminLogin,
  getAdminProfile,
} from '../controllers/adminAuthController.js';

import { requireAdminAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', adminLogin);

router.get('/me', requireAdminAuth, getAdminProfile);

export default router;