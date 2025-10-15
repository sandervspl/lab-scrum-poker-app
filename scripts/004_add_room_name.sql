-- Add room_name column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_name TEXT;

-- Set default room names for existing rooms (optional)
UPDATE rooms SET room_name = 'Scrum Poker Room' WHERE room_name IS NULL;
