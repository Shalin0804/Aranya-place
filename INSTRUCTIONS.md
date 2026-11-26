# Aranya Palace Resort & Spa — Instructions

How to run, configure, deploy and operate the booking platform.

| Part | Where it runs | Folder |
|---|---|---|
| Website + admin panel | Vercel — https://aranya-place.vercel.app | `client/` |
| API | Render — https://aranya-place.onrender.com/api | `server/` |
| Database | TiDB Cloud (MySQL-compatible) | `server/database/` |

---

## 1. Run it on your computer

Requires **Node.js 18+**.

```bash
# API
cd server
cp .env.example .env      # then fill in the values (section 2)
npm install
npm run migrate           # safe: only applies new schema changes
npm run dev               # http://localhost:5000/api

# Website (second terminal)
cd client
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev               # http://localhost:5173
```

Check the API and database: open http://localhost:5000/api/health. It should show `"database":"connected"`.

> **Never run `database/schema.sql` or `npm run seed` against the live database.** Both delete all data. They are only for a brand-new, empty database.

---

## 2. Environment variables

Secrets go only in `server/.env` locally and in Render's **Environment** tab in production. `.env` is git-ignored; never commit it.

### API (`server/.env` / Render)

| Variable | Required | Value |
|---|---|---|
| `DB_HOST` | yes | TiDB host, e.g. `gateway01.ap-southeast-1.prod.aws.tidbcloud.com` |
| `DB_PORT` | yes | `4000` |
| `DB_USER` | yes | TiDB user, e.g. `xxxx.root` |
| `DB_PASSWORD` | yes | TiDB password |
| `DB_NAME` | yes | `aranya_resort` |
| `DB_SSL` | yes | `true` (TiDB Cloud requires TLS) |
| `DATABASE_URL` | alternative | `mysql://user:pass@host:4000/aranya_resort` instead of the five `DB_*` values above |
| `JWT_SECRET` | yes | Long random string: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | no | `7d` |
| `NODE_ENV` | production | `production` |
| `CLIENT_URL` | yes | Website URL, no trailing slash: `https://aranya-place.vercel.app` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | for email | Any SMTP provider (Gmail app password, Brevo, Amazon SES…) |
| `EMAIL_FROM` | for email | `Aranya Palace Resort & Spa <stay@aranyapalace.in>` |
| `ADMIN_NOTIFY_EMAIL` | for email | Front-desk address that receives new-booking alerts |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | for online payment | From Razorpay dashboard → API Keys. `rzp_test_…` keys = test mode, nothing is charged |
| `RAZORPAY_WEBHOOK_SECRET` | for online payment | The secret you set on the Razorpay webhook (section 5) |

Without SMTP, emails are skipped (logged as `[EMAIL] skipped`). Without Razorpay keys, the "Pay online" button is hidden and guests pay at the hotel.

### Website (Vercel)

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://aranya-place.onrender.com/api` |

Vercel reads this at build time; **redeploy** after changing it.

---

## 3. Deploy

Pushing to the `main` branch on GitHub (`Shalin0804/Aranya-place`) deploys both automatically.

**Render (API)**: Web Service → Settings → Build & Deploy:
- Root Directory: `server` (or leave empty and use `cd server && npm install` / `cd server && npm start`)
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`

**Vercel (website)**: Root Directory `client`, framework Vite, env `VITE_API_URL`.

**Order for releases with database changes:** run `cd server && npm run migrate` (from a computer whose `.env` points at TiDB) **before** the new code goes live.

---

## 4. Database changes (migrations)

1. Create `server/database/migrations/NNN_short_name.sql` (next number after the last file).
2. Only add things (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`). Never drop or rename columns that hold data.
3. Run `npm run migrate` in `server/`. Already-applied files are skipped, so it's safe to re-run.

Table reference: [`server/database/README.md`](server/database/README.md).

If TiDB says **"Access denied"**, the password changed. Update `DB_PASSWORD` in `server/.env` **and** on Render, then redeploy.

---

## 5. Online payments (Razorpay)

1. Razorpay dashboard → **API Keys** → generate keys. Put them in Render as `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
2. **Settings → Webhooks → Add**:
   - URL: `https://aranya-place.onrender.com/api/payments/webhook`
   - Events: `payment.captured`, `payment.failed`, `order.paid`
   - Secret: any strong string; put the same value in Render as `RAZORPAY_WEBHOOK_SECRET`.
3. Redeploy Render. The confirmation page now shows **Pay ₹… online**.

A booking becomes **Paid** only after the server verifies Razorpay's signature. Start with `rzp_test_` keys and Razorpay's test cards; switch to live keys when ready.

---

## 6. How customers book

1. Browse rooms → pick dates and guests → **Book Now**.
2. Not signed in → redirected to **Sign in / Create account**. After signing in they return to the same room, dates and guests.
3. **Booking Details** shows their name, email and mobile from their profile (mobile is asked once if missing). They choose adults, children and special requests, then **Confirm Booking**.
4. Confirmation page → booking reference, payment, cancel. All bookings are under **Account → My Bookings**.
5. Forgot password: **Sign in → Forgot password?** → emailed link valid for 60 minutes (needs SMTP).

Rules enforced by the server: account required, prices and tax calculated by the server, no past dates, room availability checked at the moment of booking (two people can't get the last room), online cancellation only before the check-in date.

---

## 7. Admin panel

Open **https://aranya-place.vercel.app/admin/login**.

| Role | Can do |
|---|---|
| Super Admin | Everything, including Settings |
| Manager | Dashboard, bookings, payments, rooms & room types, customers, offers, reviews, gallery |
| Receptionist | Dashboard, bookings (status, check-in/out, cancel), payments, room status, view customers |
| Accountant | Dashboard, view bookings, update payment status, view customers |
| Housekeeping | View rooms and update room status |

Every change made in the admin panel is recorded in the `activity_logs` table (who, what, when).

### Add a staff account

There is no staff screen yet. Run this in `server/` (replace the name, email, password and role):

```bash
node --input-type=module -e "
import bcrypt from 'bcryptjs'; import { pool } from './config/db.js';
const hash = await bcrypt.hash('ChangeMe#2026', 12);
await pool.query('INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
  ['Front Desk', 'frontdesk@aranyapalace.in', hash, 'Receptionist']);
console.log('created'); await pool.end();"
```

Roles: `Super Admin`, `Manager`, `Receptionist`, `Accountant`, `Housekeeping`.

### Change an admin password

```bash
node --input-type=module -e "
import bcrypt from 'bcryptjs'; import { pool } from './config/db.js';
const hash = await bcrypt.hash('NEW-STRONG-PASSWORD', 12);
const [r] = await pool.query('UPDATE admins SET password_hash = ? WHERE email = ?', [hash, 'admin@aranyapalace.in']);
console.log(r.affectedRows ? 'updated' : 'no such admin'); await pool.end();"
```

**Do this now if the Super Admin still uses the seed password**: it is visible in the public repository (`server/database/seed.js`).

### Disable a staff account

```sql
UPDATE admins SET status = 'Disabled' WHERE email = 'person@aranyapalace.in';
```

Takes effect on their next request; no need to wait for their login to expire.

---

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| Render log: `Could not connect to MySQL` / `Access denied` | Wrong TiDB credentials or `DB_SSL` not `true`. Update Render env, redeploy |
| `/api/health` returns 503 | API runs but can't reach TiDB, same as above |
| Browser console: `CORS blocked origin` | `CLIENT_URL` on Render must exactly match the website URL (with `https://`, no trailing slash) |
| Website shows no rooms / "Failed to fetch" | `VITE_API_URL` wrong on Vercel, or Render is waking from sleep (free plan: first request can take ~50 s) |
| Emails not arriving | SMTP not set (Render log shows `[EMAIL] skipped`) or provider rejected it (`[EMAIL] failed`) |
| No "Pay online" button | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` not set on Render |
| Booking stays unpaid after paying | Webhook URL/secret mismatch; check Razorpay → Webhooks → delivery logs |
| Broken image | A replacement photo is shown automatically; replace the source in admin Gallery or the room's images |
| `git push` hangs | Git Credential Manager is waiting for a GitHub sign-in window |

---

## 9. For developers and AI assistants

Coding rules and architecture notes are in [`AGENTS.md`](AGENTS.md) (read by Claude Code and Antigravity).
