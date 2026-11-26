import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

import { testConnection } from './config/db.js';
import { auditAdminWrites } from './middleware/auth.js';
import {
  notFoundHandler,
  errorHandler,
} from './middleware/errorHandler.js';

// =====================================================
// PUBLIC ROUTES
// =====================================================

import authRoutes from './routes/authRoutes.js';
import roomTypeRoutes from './routes/roomTypeRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { razorpayWebhook } from './controllers/paymentController.js';
import reviewRoutes from './routes/reviewRoutes.js';

import {
  settingsRouter,
  offersRouter,
  galleryRouter,
} from './routes/contentRoutes.js';

// =====================================================
// ADMIN ROUTES
// =====================================================

import adminAuthRoutes from './routes/adminAuthRoutes.js';
import adminDashboardRoutes from './routes/adminDashboardRoutes.js';
import adminBookingRoutes from './routes/adminBookingRoutes.js';
import adminRoomRoutes from './routes/adminRoomRoutes.js';
import adminCustomerRoutes from './routes/adminCustomerRoutes.js';
import adminOfferRoutes from './routes/adminOfferRoutes.js';
import adminReviewRoutes from './routes/adminReviewRoutes.js';
import adminGalleryRoutes from './routes/adminGalleryRoutes.js';
import adminSettingsRoutes from './routes/adminSettingsRoutes.js';

// =====================================================
// ENVIRONMENT
// =====================================================

dotenv.config();

const app = express();

// Render sits behind a proxy — trust it so req.protocol reflects the
// original https scheme (needed to build correct absolute image URLs).
app.set('trust proxy', 1);

// =====================================================
// SECURITY
// =====================================================

app.use(
  helmet({
    // Gallery images are fetched cross-origin by the Vercel-hosted client's
    // <img> tags; helmet's default same-origin policy would block that.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,
].filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin header
      // PowerShell, Postman, server-to-server, etc.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log('Blocked CORS origin:', origin);

      return callback(
        new Error(`CORS blocked origin: ${origin}`)
      );
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],

    optionsSuccessStatus: 204,
  })
);

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(compression());

// Razorpay webhook signs the raw body, so it must be read before express.json.
app.post('/api/payments/webhook', express.raw({ type: 'application/json', limit: '1mb' }), razorpayWebhook);

app.use(
  express.json({
    limit: '2mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// =====================================================
// HEALTH CHECK
// =====================================================

// Reports database reachability too, so Render health checks catch a
// broken TiDB connection rather than only a running process.
app.get('/api/health', async (req, res) => {
  try {
    await testConnection();
    res.json({ success: true, message: 'Aranya Palace API is running.', database: 'connected' });
  } catch (err) {
    console.error('[HEALTH] database unreachable:', err.message);
    res.status(503).json({ success: false, message: 'Database unreachable.', database: 'disconnected' });
  }
});

// =====================================================
// PUBLIC AUTH
// =====================================================

app.use(
  '/api/auth',
  authRoutes
);

// =====================================================
// ADMIN AUDIT LOG (records successful admin writes)
// =====================================================

app.use('/api/admin', auditAdminWrites);

// =====================================================
// ADMIN AUTH
// =====================================================

app.use(
  '/api/admin/auth',
  adminAuthRoutes
);

// =====================================================
// ADMIN DASHBOARD
// =====================================================

app.use(
  '/api/admin/dashboard',
  adminDashboardRoutes
);

// =====================================================
// ADMIN BOOKINGS
// =====================================================

app.use(
  '/api/admin/bookings',
  adminBookingRoutes
);

// =====================================================
// ADMIN ROOMS
// =====================================================

app.use(
  '/api/admin/rooms',
  adminRoomRoutes
);

// =====================================================
// ADMIN CUSTOMERS
// =====================================================

app.use(
  '/api/admin/customers',
  adminCustomerRoutes
);

// =====================================================
// ADMIN OFFERS
// =====================================================

app.use(
  '/api/admin/offers',
  adminOfferRoutes
);

// =====================================================
// ADMIN REVIEWS
// =====================================================

app.use(
  '/api/admin/reviews',
  adminReviewRoutes
);

// =====================================================
// ADMIN GALLERY
// =====================================================

app.use(
  '/api/admin/gallery',
  adminGalleryRoutes
);

// =====================================================
// ADMIN SETTINGS
// =====================================================

app.use(
  '/api/admin/settings',
  adminSettingsRoutes
);

// =====================================================
// PUBLIC ROOM TYPES
// =====================================================

app.use(
  '/api/room-types',
  roomTypeRoutes
);

// =====================================================
// PUBLIC BOOKINGS
// =====================================================

app.use(
  '/api/bookings',
  bookingRoutes
);

// =====================================================
// PUBLIC PAYMENTS (Razorpay)
// =====================================================

app.use(
  '/api/payments',
  paymentRoutes
);

// =====================================================
// PUBLIC REVIEWS
// =====================================================

app.use(
  '/api/reviews',
  reviewRoutes
);

// =====================================================
// PUBLIC SETTINGS
// =====================================================

app.use(
  '/api/settings',
  settingsRouter
);

// =====================================================
// PUBLIC OFFERS
// =====================================================

app.use(
  '/api/offers',
  offersRouter
);

// =====================================================
// PUBLIC GALLERY
// =====================================================

app.use(
  '/api/gallery',
  galleryRouter
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use(
  notFoundHandler
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
  errorHandler
);

// =====================================================
// SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

testConnection()
  .then(() => {
    app.listen(
      PORT,
      () => {
        console.log(
          `Aranya Palace API listening on http://localhost:${PORT}`
        );
      }
    );
  })
  .catch((err) => {
    console.error(
      'Could not connect to MySQL. Check your .env settings.'
    );

    console.error(
      err.message
    );

    process.exit(1);
  });

export default app;