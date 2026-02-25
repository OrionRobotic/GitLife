CREATE TABLE IF NOT EXISTS blog_labels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE ("userId", name)
);

ALTER TABLE blog_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own labels" ON blog_labels
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own labels" ON blog_labels
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can delete own labels" ON blog_labels
  FOR DELETE USING (auth.uid() = "userId");
