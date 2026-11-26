# Aranya Palace Resort & Spa

Live: https://aranya-place.vercel.app (client on Vercel, API on Render, database on TiDB Cloud).

## Features
- **Guest booking without login**: dates, rooms, guests, country; server-side pricing and tax; unique reference; private manage link (`?token=`) to view, pay or cancel.
- **Availability engine**: real inventory per room type; concurrency-safe booking (tested: 3 simultaneous guests for the last 2 rooms → exactly 2 succeed).
- **Payments (Razorpay)**: order created from the server-side total; booking marked Paid only after HMAC signature verification (checkout callback or signed webhook). Hidden when keys are not set.
- **Email**: branded HTML confirmations, cancellations, updates, payment receipts, and admin new-booking alerts over any SMTP. Skipped (and logged) when SMTP is not set.
- **Admin dashboard**: occupancy tonight, today's check-ins/outs, week/month revenue, bookings, rooms, customers, offers, reviews, gallery, settings. Role-based permissions (Super Admin, Manager, Receptionist, Accountant, Housekeeping) and an audit log of all admin changes.
- **SEO**: per-page titles, Open Graph, canonical, `Resort` + `HotelRoom` structured data, `robots.txt`, `sitemap.xml`.

Database details: [server/database/README.md](server/database/README.md).

## Deployment

**API (Render Web Service)**: Root Directory `server`, Build `npm install`, Start `npm start`, Health Check Path `/api/health` (returns 503 if TiDB is unreachable). Set the environment variables from `server/.env.example`: at minimum `DB_*` (or `DATABASE_URL`), `DB_SSL=true`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_URL` (the Vercel URL).

**Client (Vercel)**: Root Directory `client`, env `VITE_API_URL=https://<render-service>.onrender.com/api`, then redeploy.

**Razorpay webhook**: Dashboard → Settings → Webhooks → URL `https://<render-service>.onrender.com/api/payments/webhook`, events `payment.captured`, `payment.failed`, `order.paid`, secret = `RAZORPAY_WEBHOOK_SECRET`.

**Schema changes**: run `cd server && npm run migrate` once (from any machine whose `.env` points at the database) before deploying code that needs them.

## Running it locally

Requires Node 18+ and MySQL 8 or TiDB Cloud (set `DB_PORT=4000`, `DB_SSL=true`).

**Existing / live database:** never run `schema.sql` or `seed` — just `npm run migrate`.

### 1. Backend

```bash
cd server
cp .env.example .env        # edit DB_PASSWORD etc. to match your MySQL setup
npm install

mysql -u root -p -e "CREATE DATABASE aranya_resort CHARACTER SET utf8mb4;"
mysql -u root -p -e "CREATE USER 'aranya_app'@'localhost' IDENTIFIED BY 'yourpassword';"
mysql -u root -p -e "GRANT ALL ON aranya_resort.* TO 'aranya_app'@'localhost';"

mysql -u aranya_app -p aranya_resort < database/schema.sql   # FRESH database only — drops all tables
npm run migrate             # applies database/migrations/*.sql (safe on live data, re-runnable)
npm run seed                # demo data; refuses if bookings exist (wipes everything with --force)
npm run dev                 # API on http://localhost:5000
```

### 2. Frontend

```bash
cd client
cp .env.example .env        # defaults to http://localhost:5000/api, fine as-is
npm install
npm run dev                 # site on http://localhost:5173
```

Demo login: `demo@aranyapalace.in` / `Guest@1234`

## Project structure

```
aranya-resort/
├── server/
│   ├── config/db.js          MySQL connection pool
│   ├── controllers/          Route handlers (auth, rooms, bookings, reviews, content)
│   ├── database/
│   │   ├── schema.sql        Full DB schema
│   │   └── seed.js           Demo data loader
│   ├── middleware/           Auth, rate limiting, error handling
│   ├── routes/                REST endpoints
│   ├── utils/                 Booking math, JWT, error class
│   └── server.js             Express entry point
└── client/
    └── src/
        ├── components/        Navbar, Footer, RoomCard, SearchWidget, etc.
        ├── context/            Auth + Toast providers
        ├── pages/              One file (+ CSS) per route
        ├── services/api.js    Axios client
        └── styles/             Design tokens + global styles
```

