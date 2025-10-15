-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on rooms" ON rooms;
DROP POLICY IF EXISTS "Allow all operations on participants" ON participants;
DROP POLICY IF EXISTS "Allow all operations on votes" ON votes;

-- Recreate policies with explicit permissions
CREATE POLICY "Enable all access for rooms" ON rooms
  FOR ALL 
  TO anon, authenticated
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Enable all access for participants" ON participants
  FOR ALL 
  TO anon, authenticated
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Enable all access for votes" ON votes
  FOR ALL 
  TO anon, authenticated
  USING (true) 
  WITH CHECK (true);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
