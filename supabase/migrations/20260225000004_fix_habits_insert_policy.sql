-- Add userId column to habits table if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habits' AND column_name = 'userId'
  ) THEN
    ALTER TABLE habits ADD COLUMN "userId" UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Enable RLS (safe to run even if already enabled)
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts, then recreate
DROP POLICY IF EXISTS "Users can insert habits" ON habits;
DROP POLICY IF EXISTS "Users can view habits" ON habits;
DROP POLICY IF EXISTS "Users can delete habits" ON habits;

-- Authenticated users can insert their own habits
CREATE POLICY "Users can insert habits" ON habits
  FOR INSERT WITH CHECK (auth.uid() = "userId");

-- Users can view global habits (userId IS NULL, e.g. seeded habits)
-- and their own habits
CREATE POLICY "Users can view habits" ON habits
  FOR SELECT USING (
    "userId" IS NULL OR auth.uid() = "userId"
  );

-- Users can delete their own habits
CREATE POLICY "Users can delete habits" ON habits
  FOR DELETE USING (auth.uid() = "userId");
