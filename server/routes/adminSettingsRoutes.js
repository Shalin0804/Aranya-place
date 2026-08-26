import { Router } from 'express';

import {
  getAdminSettings,
  updateAdminSettings,
} from '../controllers/adminSettingsController.js';

import { requireAdminAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAdminAuth);

router.get('/', getAdminSettings);
router.put('/', updateAdminSettings);

export default router;