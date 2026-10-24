import { expect, test } from "bun:test";
import { applyWrite, matches } from "../src/lib/offline";

const BASE = "https://x.supabase.co/rest/v1";
// Same shape as getTasks: pending, or done since midnight.
const TASKS = `${BASE}/tasks?select=*&or=(done.eq.false,completedAt.gte."2026-10-24T00:00:00.000Z")&order=createdAt.asc`;

const pending = {
  id: "a",
  title: "A",
  done: false,
  completedAt: null,
  createdAt: "2026-10-23T09:00:00Z",
};
const oldDone = {
  id: "b",
  title: "B",
  done: true,
  completedAt: "2026-10-20T10:00:00Z",
  createdAt: "2026-10-19T09:00:00Z",
};

test("filters follow PostgREST semantics for the operators the app uses", () => {
  const q = new URL(TASKS).searchParams;
  expect(matches(pending, q)).toBe(true);
  expect(matches(oldDone, q)).toBe(false);
  const logs = new URL(
    `${BASE}/habitsLogs?habitId=eq.h1&createdAt=gte.2026-10-24T00:00:00Z&createdAt=lt.2026-10-24T23:59:59Z`
  ).searchParams;
  expect(
    matches({ habitId: "h1", createdAt: "2026-10-24T08:00:00+00:00" }, logs)
  ).toBe(true);
  expect(
    matches({ habitId: "h1", createdAt: "2026-10-25T08:00:00+00:00" }, logs)
  ).toBe(false);
  expect(
    matches({ habitId: "h2", createdAt: "2026-10-24T08:00:00+00:00" }, logs)
  ).toBe(false);
});

test("offline insert, complete and delete update the cached task list", () => {
  const add = applyWrite([pending], TASKS, {
    method: "POST",
    url: `${BASE}/tasks?select=*`,
    body: [
      { id: "c", title: "C", done: false, createdAt: "2026-10-24T10:00:00Z" },
    ],
    upsert: false,
  });
  expect(add.rows.map((r) => r.id)).toEqual(["a", "c"]);

  const done = applyWrite(add.rows, TASKS, {
    method: "PATCH",
    url: `${BASE}/tasks?id=eq.a`,
    body: { done: true, completedAt: "2026-10-24T11:00:00Z" },
    upsert: false,
  });
  expect(done.affected).toEqual([
    { ...pending, done: true, completedAt: "2026-10-24T11:00:00Z" },
  ]);
  expect(done.rows.map((r) => r.id)).toEqual(["a", "c"]); // done today: still listed

  const gone = applyWrite(done.rows, TASKS, {
    method: "DELETE",
    url: `${BASE}/tasks?id=eq.c`,
    body: null,
    upsert: false,
  });
  expect(gone.rows.map((r) => r.id)).toEqual(["a"]);
});

test("upsert replaces the row with the same conflict key", () => {
  const url = `${BASE}/goal_periods?select=*&userId=eq.u`;
  const row = {
    id: "p",
    userId: "u",
    type: "weekly",
    periodStart: "2026-10-19",
    title: "Old",
  };
  const out = applyWrite([row], url, {
    method: "POST",
    url: `${BASE}/goal_periods?on_conflict=userId,type,periodStart&select=*`,
    body: {
      userId: "u",
      type: "weekly",
      periodStart: "2026-10-19",
      title: "New",
    },
    upsert: true,
  });
  expect(out.rows).toHaveLength(1);
  expect(out.rows[0]).toEqual({ ...row, title: "New" }); // keeps its id
});
