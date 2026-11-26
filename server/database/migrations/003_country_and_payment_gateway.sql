-- Guest country captured on the booking form.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_country VARCHAR(80) NULL;

-- Razorpay order/payment references. transaction_id (existing) holds the
-- gateway payment id once verified.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway_order_id VARCHAR(120) NULL;
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order ON payments (gateway_order_id);
