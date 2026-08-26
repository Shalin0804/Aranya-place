import { Router } from 'express';

import {
  getDashboardStats,
} from '../controllers/adminDashboardController.js';

import {
  requireAdminAuth,
} from '../middleware/auth.js';

const router = Router();

router.get(
  '/',
  requireAdminAuth,
  getDashboardStats
);

export default router;