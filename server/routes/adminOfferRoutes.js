import { Router } from 'express';

import {
  getAdminOffers,
  getAdminOfferById,
  createAdminOffer,
  updateAdminOffer,
  deleteAdminOffer,
  updateOfferStatus,
} from '../controllers/adminOfferController.js';

import { requireAdminAuth, requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(requireAdminAuth, requirePermission('content.manage'));

router.get('/', getAdminOffers);

router.get('/:id', getAdminOfferById);

router.post('/', createAdminOffer);

router.put('/:id', updateAdminOffer);

router.put('/:id/status', updateOfferStatus);

router.delete('/:id', deleteAdminOffer);

export default router;