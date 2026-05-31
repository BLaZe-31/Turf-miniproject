-- Add peak hours columns to turfs table
-- Default 17 (5 PM) to 20 (8 PM) for existing turfs
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS peak_hour_start integer DEFAULT 17;
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS peak_hour_end integer DEFAULT 20;

-- Add max players column
-- Default 10 for existing turfs
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS max_players integer DEFAULT 10;
