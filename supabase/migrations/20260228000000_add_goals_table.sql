CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly', 'semester')),
  "periodStart" DATE NOT NULL,
  "periodEnd" DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (auth.uid() = "userId");
