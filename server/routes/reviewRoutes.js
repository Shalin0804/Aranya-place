import { Router } from 'express';
import { listApprovedReviews, submitReview } from '../controllers/reviewController.js';
import { attachCustomerIfPresent } from '../middleware/auth.js';

const router = Router();

router.get('/', listApprovedReviews);
router.post('/', attachCustomerIfPresent, submitReview);

export default router;
