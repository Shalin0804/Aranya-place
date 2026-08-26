import { Router } from 'express';
import { listRoomTypes, getRoomTypeBySlug } from '../controllers/roomTypeController.js';

const router = Router();

router.get('/', listRoomTypes);
router.get('/:slug', getRoomTypeBySlug);

export default router;
