import { Router } from 'express';

import {
  getAdminSettings,
  updateAdminSettings,
} from '../controllers/adminSettingsController.js';

import { requireAdminAuth, requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(requireAdminAuth, requirePermission('settings.manage'));

router.get('/', getAdminSettings);
router.put('/', updateAdminSettings);

export default router;