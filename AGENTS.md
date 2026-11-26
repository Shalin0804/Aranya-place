# Aranya Palace Resort & Spa — agent guide

Project root (absolute): `D:\CF\Codes\For demo\2`

When calling the claude-code MCP tool, always pass absolute paths under this project root — the tool's working directory is Antigravity's install folder, not this project.

## Stack
- `server/` — Node 18+, Express 5, ESM, `mysql2/promise` pool (`server/config/db.js`), JWT auth. No ORM.
- `client/` — React 19 + Vite, react-router 7, custom CSS (no Tailwind). Customer site in `src/pages`, admin in `src/admin`.
- Database — **TiDB Cloud (live, holds real bookings)**, MySQL-compatible, TLS via `DB_SSL=true`. Credentials only in `server/.env`.
- Deploy — API on Render, client on Vercel (`client/vercel.json`).

## Commands
- API: `cd server && npm run dev` (port 5000)
- Client: `cd client && npm run dev`, `npm run build`, `npm run lint` (oxlint)
- Schema changes: add `server/database/migrations/NNN_name.sql`, then `cd server && npm run migrate`

## Rules
- Never run `server/database/schema.sql` or `npm run seed` against the live DB: they DROP/TRUNCATE everything. Seed refuses when bookings exist unless `--force`.
- Migrations must be additive and idempotent (`IF NOT EXISTS`); TiDB auto-commits DDL.
- Prices, taxes and availability are computed server-side only (`server/utils/booking.js`). Bookings are created in a transaction that locks the room type row (`FOR UPDATE`).
- **No guest checkout.** Creating, viewing (`/api/bookings/ref/:ref`), cancelling and paying for a booking all require a signed-in customer (`requireCustomerAuth`); new bookings always store `customer_id`. Older guest bookings (`customer_id` NULL) are kept for history and are visible to admins only. The `access_token` column is legacy: no longer issued or accepted.
- Customer and admin auth are separate JWT types (`type: 'customer'` vs `'admin'`); neither is accepted where the other is required.
- Password reset: `/api/auth/forgot-password` → emailed one-time link (hash stored, 60 min) → `/api/auth/reset-password`.
- Admin routes: `requireAdminAuth` + `requirePermission('<perm>')` from `server/middleware/auth.js`. The role→permission map lives there; Super Admin has all. Successful admin writes are logged to `activity_logs` automatically.
- Booking transactions run at READ COMMITTED + `FOR UPDATE` on the room type (see `server/database/README.md` for why TiDB needs this).
- Booking events go through `notifyBooking(id, event)` (`server/utils/notify.js`): emails via SMTP (skipped if unset) and an admin notification row. Never await it in a request path that must not fail.
- Payments: Razorpay via REST (`server/controllers/paymentController.js`). A booking becomes Paid only after HMAC verification (checkout callback or signed webhook).
- Use parameterized queries only.
