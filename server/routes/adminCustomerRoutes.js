import { Router } from 'express';

import {
  getAdminCustomers,
  getAdminCustomerById,
  updateCustomerStatus,
} from '../controllers/adminCustomerController.js';

import { requireAdminAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAdminAuth);

router.get('/', getAdminCustomers);
router.get('/:id', getAdminCustomerById);
router.put('/:id/status', updateCustomerStatus);

export default router;