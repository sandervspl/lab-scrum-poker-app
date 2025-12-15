-- Add admin_ids array column (keep admin_id for backwards compatibility)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS admin_ids TEXT[];

-- Migrate existing admin_id values to admin_ids array where admin_ids is null
UPDATE rooms SET admin_ids = ARRAY[admin_id] WHERE admin_ids IS NULL AND admin_id IS NOT NULL;

-- Create index for array contains lookup
CREATE INDEX IF NOT EXISTS idx_rooms_admin_ids ON rooms USING GIN (admin_ids);
