# Aranya Palace Resort & Spa — Customer Website

Status: **Customer-facing site + backend, complete and tested.** The admin
dashboard has not been built yet (per your instructions, that's phase 2).

## What's working

**Backend** (Node/Express + MySQL):
- Full schema (`server/database/schema.sql`) covering the whole spec —
  including tables the admin dashboard will use later.
- Seed script with realistic demo data: 6 room types, 28 physical rooms,
  20 customer accounts, ~30 bookings across past/current/future dates,
  6 approved reviews, 3 active offers, gallery images.
- REST API: auth (register/login/JWT), room browsing with live availability,
  race-condition-safe booking creation, booking lookup/cancel, reviews,
  settings, offers, gallery. Rate-limited, helmet + CORS, centralized errors.
- Tested end-to-end: booked the last 2 units of a room type, confirmed a 3rd
  request correctly gets rejected as fully booked; logged in, created a
  booking, confirmed it shows up in "my bookings."

**Frontend** (React + Vite, custom CSS, no Tailwind):
- Home — hero with live search, featured rooms, about, amenities, live
  special offers, gallery preview, live guest reviews, nearby attractions
- Rooms — full listing with live availability by date/guest search, sorting
- Room Details — image gallery + lightbox, amenities, policies, per-room
  reviews, sticky booking panel with real-time price calculation
- Booking — guest details form, price breakdown, submits to the real API
- Booking Confirmation — reference number, print / download / email actions
- Login / Register, Account (Profile + My Bookings with cancel, tabbed by
  upcoming/current/completed/cancelled)
- Gallery with category filters
- Fully responsive (mobile drawer nav, stacking grids, touch-friendly forms)

Design direction: "Aranya Palace" — a restored 1920s haveli turned resort
in an orchard outside Ahmedabad. Ivory/charcoal/brass palette with a deep
forest-green secondary accent, Fraunces display serif + Inter body, a
botanical line-art divider as the recurring motif, and a slow golden-hour
light animation in the hero.

## What's NOT built yet

- Admin dashboard (rooms, bookings, customers, reports, roles, etc.)
- Payment gateway integration (schema + status tracking exist; no live gateway)
- Notification delivery (table exists; no email/SMS sending wired up —
  "Email Confirmation" on the confirmation page is a UI stub)

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

Say the word when you're ready for the admin dashboard.
