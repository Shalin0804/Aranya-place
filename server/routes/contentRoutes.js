import { Router } from 'express';
import { getSettings, listActiveOffers, listGallery, getGalleryImage } from '../controllers/contentController.js';

const settingsRouter = Router();
settingsRouter.get('/', getSettings);

const offersRouter = Router();
offersRouter.get('/', listActiveOffers);

const galleryRouter = Router();
galleryRouter.get('/', listGallery);
galleryRouter.get('/:id/image', getGalleryImage);

export { settingsRouter, offersRouter, galleryRouter };
