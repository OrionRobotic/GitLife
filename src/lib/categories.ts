// Fixed contribution categories: global habits ("userId" IS NULL) seeded by
// supabase/migrations/20261024000000_seed_contribution_categories.sql.
// To add one: insert the row in a new migration and append its name here.
export const CATEGORY_NAMES = [
  "Workout",
  "Reading",
  "1h Thinking / Research",
  "45min Music",
];

/** Categories found in `habits` (matched by name), in CATEGORY_NAMES order. Missing ones are skipped. */
export function getCategoryHabits<T extends { id: string; name: string }>(
  habits: T[]
): T[] {
  return CATEGORY_NAMES.flatMap((name) => {
    const habit = habits.find(
      (h) => h.name.toLowerCase() === name.toLowerCase()
    );
    return habit ? [{ ...habit, name }] : [];
  });
}
