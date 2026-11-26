# Database

TiDB Cloud (MySQL 8 compatible). Driver: `mysql2/promise` pool in `config/db.js`.

## Files
- `schema.sql`: full schema for a **fresh, empty** database only (it drops tables).
- `migrations/NNN_*.sql`: additive, idempotent changes. Apply with `npm run migrate`; applied files are tracked in `schema_migrations`.
- `seed.js`: demo data. Refuses to run when bookings exist (pass `--force` only on a disposable DB).

## Tables
| Table | Purpose |
|---|---|
| `room_types` | Bookable categories: price, capacity, bed, size |
| `room_type_amenities`, `room_type_images` | Per-category amenities and photos |
| `rooms` | Physical rooms (number, floor, status). Inventory for availability |
| `bookings` | One row per reservation. `customer_id` NULL = guest booking; `access_token` = guest's private link; `guest_country` |
| `payments` | Payment attempts per booking. `gateway_order_id` = Razorpay order, `transaction_id` = Razorpay payment id |
| `customers` | Optional registered guest accounts |
| `admins` | Staff accounts. `role`: Super Admin, Manager, Receptionist, Accountant, Housekeeping |
| `offers` | Discounts with validity dates and usage limits |
| `reviews` | Guest reviews, moderated (`Pending/Approved/Rejected`) |
| `gallery` | Website gallery images |
| `hotel_settings` | Single row (id = 1): contact info, tax %, check-in/out times, policies |
| `notifications` | Admin alerts: new booking, cancellation, payment received |
| `activity_logs` | Audit trail of every successful admin write |
| `schema_migrations` | Applied migration files |

## Availability and double-booking
`available = rooms of the type not in Maintenance/Out of Service − rooms held by overlapping Pending/Confirmed/Checked In bookings`
(overlap: `check_in < requested check_out AND check_out > requested check_in`).

Booking creation locks the `room_types` row (`FOR UPDATE`) inside a **READ COMMITTED** transaction. READ COMMITTED matters on TiDB: under REPEATABLE READ the snapshot is fixed when the locking statement starts, so a booking committed while waiting for the lock would be missed and the room double-booked.
