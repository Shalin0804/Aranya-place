import { Router } from 'express';

import {
  getAdminGallery,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
} from '../controllers/adminGalleryController.js';

import { requireAdminAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAdminAuth);

router.get('/', getAdminGallery);
router.post('/', createGalleryImage);
router.put('/:id', updateGalleryImage);
router.delete('/:id', deleteGalleryImage);

export default router;