import { Router } from 'express';

import {
  getAdminReviews,
  updateReviewStatus,
  deleteReview,
} from '../controllers/adminReviewController.js';

import { requireAdminAuth, requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(requireAdminAuth, requirePermission('content.manage'));

router.get('/', getAdminReviews);
router.put('/:id/status', updateReviewStatus);
router.delete('/:id', deleteReview);

export default router;