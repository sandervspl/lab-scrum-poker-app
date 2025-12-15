-- Add voting_mode column to rooms table
-- Supports 'fibonacci' (default) or 'tshirt' sizing

-- Create enum type for voting modes
CREATE TYPE voting_mode_type AS ENUM ('fibonacci', 'tshirt');

ALTER TABLE rooms
ADD COLUMN voting_mode voting_mode_type NOT NULL DEFAULT 'fibonacci';

-- Add comment for documentation
COMMENT ON COLUMN rooms.voting_mode IS 'Voting mode: fibonacci (0,1,2,3,5,8,13,21,?,☕) or tshirt (XS,S,M,L,XL,XXL)';

