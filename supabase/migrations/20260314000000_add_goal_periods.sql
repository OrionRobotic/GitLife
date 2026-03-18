CREATE TABLE IF NOT EXISTS goal_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly', 'semester')),
  "periodStart" DATE NOT NULL,
  "periodEnd" DATE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE ("userId", type, "periodStart", "periodEnd")
);
ALTER TABLE goal_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goal_periods"   ON goal_periods FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert own goal_periods" ON goal_periods FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update own goal_periods" ON goal_periods FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Users can delete own goal_periods" ON goal_periods FOR DELETE USING (auth.uid() = "userId");
