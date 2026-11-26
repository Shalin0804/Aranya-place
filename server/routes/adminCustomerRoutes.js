import { Router } from 'express';

import {
  getAdminCustomers,
  getAdminCustomerById,
  updateCustomerStatus,
} from '../controllers/adminCustomerController.js';

import { requireAdminAuth, requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(requireAdminAuth);

router.get('/', requirePermission('customers.view'), getAdminCustomers);
router.get('/:id', requirePermission('customers.view'), getAdminCustomerById);
router.put('/:id/status', requirePermission('customers.manage'), updateCustomerStatus);

export default router;
