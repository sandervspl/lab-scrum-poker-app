-- Add performance indexes based on query pattern analysis

-- Composite index for sorted participant queries
-- This index optimizes the common query pattern in getParticipants() where we:
-- 1. Filter by room_id
-- 2. Sort by joined_at ascending
-- 
-- Without this composite index, PostgreSQL would:
-- - Use idx_participants_room_id to filter by room_id
-- - Then perform a separate sort operation on joined_at
--
-- With this composite index, PostgreSQL can:
-- - Use a single index scan that returns pre-sorted results
-- - Eliminate the sort operation entirely
--
-- Performance impact: Significant improvement for rooms with many participants,
-- especially noticeable when the participants table grows large.
CREATE INDEX IF NOT EXISTS idx_participants_room_joined 
  ON participants(room_id, joined_at);

-- Note: We keep the existing idx_participants_room_id index because:
-- 1. It's still useful for queries that only filter by room_id without sorting
-- 2. PostgreSQL's query planner will automatically choose the most efficient index
-- 3. The overhead of maintaining an additional index is minimal compared to the performance gains

