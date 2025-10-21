-- Add CHECK constraint for max name length
ALTER TABLE participants 
ADD CONSTRAINT participants_name_length_check 
CHECK (char_length(name) <= 20);

