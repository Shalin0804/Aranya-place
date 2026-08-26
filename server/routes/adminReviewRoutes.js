import { Router } from 'express';

import {
  getAdminReviews,
  updateReviewStatus,
  deleteReview,
} from '../controllers/adminReviewController.js';

import { requireAdminAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAdminAuth);

router.get('/', getAdminReviews);
router.put('/:id/status', updateReviewStatus);
router.delete('/:id', deleteReview);

export default router;