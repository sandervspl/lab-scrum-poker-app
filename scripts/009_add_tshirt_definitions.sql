-- Add tshirt_definitions column to rooms table
-- Stores custom t-shirt size definitions as JSONB (e.g., {"XS": "1-2 days", "S": "3-5 days", ...})

ALTER TABLE rooms
ADD COLUMN tshirt_definitions JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN rooms.tshirt_definitions IS 'Custom t-shirt size definitions as JSON object. Null means use defaults.';

