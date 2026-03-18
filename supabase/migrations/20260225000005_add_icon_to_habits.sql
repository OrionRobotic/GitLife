-- Add icon column to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'BookOpen';
