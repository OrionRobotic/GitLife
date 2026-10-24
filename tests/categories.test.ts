import { expect, test } from "bun:test";
import { getCategoryHabits } from "../src/lib/categories";

test("matches categories by name, in category order, skipping missing ones", () => {
  const habits = [
    { id: "m", name: "45min music" },
    { id: "x", name: "Sleep" },
    { id: "w", name: "Workout" },
  ];
  expect(getCategoryHabits(habits)).toEqual([
    { id: "w", name: "Workout" },
    { id: "m", name: "45min Music" },
  ]);
  expect(getCategoryHabits([])).toEqual([]);
});
