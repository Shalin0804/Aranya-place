-- Secret token that lets a guest who booked without an account view/cancel
-- their own booking. Existing rows stay NULL (only reachable by their
-- logged-in owner or admins).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS access_token VARCHAR(64) NULL;

-- Staff roles for RBAC. Appending enum values keeps existing rows valid.
ALTER TABLE admins MODIFY role ENUM('Super Admin','Manager','Receptionist','Accountant','Housekeeping')
  NOT NULL DEFAULT 'Receptionist';

CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs (created_at);
