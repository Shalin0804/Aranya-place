import { Router } from 'express';

import { getDashboardStats } from '../controllers/adminDashboardController.js';
import { requireAdminAuth, requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAdminAuth, requirePermission('dashboard.view'), getDashboardStats);

export default router;
