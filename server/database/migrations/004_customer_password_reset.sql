-- One-time password reset token (SHA-256 hash only; the raw token is
-- emailed to the customer) with expiry.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_reset_hash CHAR(64) NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_reset_expires DATETIME NULL;
CREATE INDEX IF NOT EXISTS idx_customers_reset_hash ON customers (password_reset_hash);
