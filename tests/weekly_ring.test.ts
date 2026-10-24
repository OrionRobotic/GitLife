import { expect, test } from "bun:test";
import { getWeeklyRingSegments } from "../src/components/WeeklyTorusRing";

test("empty weeks show four incomplete, unlabelled segments", () => {
  const segments = getWeeklyRingSegments([]);
  expect(segments).toHaveLength(4);
  expect(
    segments.every((segment) => !segment.completed && segment.title === "")
  ).toBe(true);
});

test("configured weeks keep each goal's order, title, and completion", () => {
  const goals = [
    { title: "Read", completed: false },
    { title: "Write", completed: true },
  ];
  expect(getWeeklyRingSegments(goals)).toBe(goals);
  expect(getWeeklyRingSegments(goals)[1].completed).toBe(true);
});
