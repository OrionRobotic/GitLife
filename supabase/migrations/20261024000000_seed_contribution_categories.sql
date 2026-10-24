-- Seed the fixed contribution categories as global habits ("userId" IS NULL).
-- They are readable by every user through the existing "Users can view habits" policy.
-- Idempotent: skips any category that already exists as a global habit.
INSERT INTO habits (name, icon, "userId")
SELECT v.name, v.icon, NULL
FROM (VALUES
  ('Workout', 'Dumbbell'),
  ('Reading', 'BookOpen'),
  ('1h Thinking / Research', 'Brain'),
  ('45min Music', 'Music')
) AS v(name, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM habits h
  WHERE h."userId" IS NULL AND lower(h.name) = lower(v.name)
);
