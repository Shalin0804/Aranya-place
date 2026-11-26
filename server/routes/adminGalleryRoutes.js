import { Router } from 'express';
import multer from 'multer';

import {
  getAdminGallery,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
} from '../controllers/adminGalleryController.js';

import { requireAdminAuth, requirePermission } from '../middleware/auth.js';
import { ApiError } from '../utils/apiError.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new ApiError(400, 'Only image files are allowed.'));
    }
    cb(null, true);
  },
});

function handleUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, 'Image must be smaller than 5MB.'));
    }
    next(err instanceof ApiError ? err : new ApiError(400, err.message));
  });
}

router.use(requireAdminAuth, requirePermission('content.manage'));

router.get('/', getAdminGallery);
router.post('/', handleUpload, createGalleryImage);
router.put('/:id', handleUpload, updateGalleryImage);
router.delete('/:id', deleteGalleryImage);

export default router;
