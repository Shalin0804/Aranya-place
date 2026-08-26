import { Router } from 'express';
import { getSettings, listActiveOffers, listGallery } from '../controllers/contentController.js';

const settingsRouter = Router();
settingsRouter.get('/', getSettings);

const offersRouter = Router();
offersRouter.get('/', listActiveOffers);

const galleryRouter = Router();
galleryRouter.get('/', listGallery);

export { settingsRouter, offersRouter, galleryRouter };
