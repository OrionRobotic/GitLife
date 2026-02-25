-- Create blogs table for user blog entries
CREATE TABLE IF NOT EXISTS blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own blogs
CREATE POLICY "Users can view own blogs" ON blogs
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own blogs" ON blogs
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own blogs" ON blogs
  FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own blogs" ON blogs
  FOR DELETE USING (auth.uid() = "userId");
