// GitLife MCP tools, shared by the stdio (mcp/server.ts) and HTTP (api/mcp.ts)
// entries. Signs in as the user so Row Level Security applies.
// Relative imports use .js so Vercel's Node ESM runtime can resolve them.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { dateToInteger } from "../src/lib/utils/dateToInteger.js";

const REQUIRED_ENV = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "GITLIFE_EMAIL",
  "GITLIFE_PASSWORD",
] as const;

export const missingEnv = () => REQUIRED_ENV.filter((k) => !process.env[k]);

let session: Promise<{ db: SupabaseClient; userId: string }> | undefined;

async function signIn() {
  const missing = missingEnv();
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
  const db = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data, error } = await db.auth.signInWithPassword({
    email: process.env.GITLIFE_EMAIL!,
    password: process.env.GITLIFE_PASSWORD!,
  });
  if (error) throw new Error(`Supabase sign-in failed: ${error.message}`);
  return { db, userId: data.user.id };
}

// Signs in on the first tool call, so clients can list tools without credentials.
function auth() {
  session ??= signIn().catch((e) => {
    session = undefined;
    throw e;
  });
  return session;
}

const dateArg = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .describe("Date as YYYY-MM-DD");

// YYYY-MM-DD -> YYYYMMDD; undefined -> today (local time, like the app).
const toInt = (date?: string) =>
  date ? Number(date.replaceAll("-", "")) : dateToInteger(new Date());

const toIso = (n: number) =>
  `${String(n).slice(0, 4)}-${String(n).slice(4, 6)}-${String(n).slice(6)}`;

const today = () => toIso(dateToInteger(new Date()));

const ok = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

async function findHabit(db: SupabaseClient, habit: string) {
  const { data, error } = await db.from("habits").select("id, name, icon");
  if (error) throw new Error(error.message);
  const match = data.find(
    (h) => h.id === habit || h.name.toLowerCase() === habit.toLowerCase()
  );
  if (!match) {
    const names = data.map((h) => h.name).join(", ");
    throw new Error(`Habit "${habit}" not found. Available: ${names}`);
  }
  return match;
}

// done: restrict the lookup to pending (false) or completed (true) tasks.
async function findTask(db: SupabaseClient, task: string, done?: boolean) {
  let query = db
    .from("tasks")
    .select("id, title, done, dueDate")
    .order("createdAt", { ascending: true });
  if (done !== undefined) query = query.eq("done", done);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const match = data.find(
    (t) => t.id === task || t.title.toLowerCase() === task.toLowerCase()
  );
  if (!match) {
    const titles = data.map((t) => t.title).join(", ") || "none";
    throw new Error(`Task "${task}" not found. Candidates: ${titles}`);
  }
  return match;
}

async function setTaskDone(task: string, done: boolean) {
  const { db } = await auth();
  const { id } = await findTask(db, task, !done);
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("tasks")
    .update({ done, completedAt: done ? now : null, updatedAt: now })
    .eq("id", id)
    .select("id, title, done, dueDate, completedAt")
    .single();
  if (error) throw new Error(error.message);
  return ok(data);
}

const taskArg = z.string().describe("Task id or title (case-insensitive)");

export function createServer() {
  const server = new McpServer({ name: "gitlife", version: "1.0.0" });

  server.registerTool(
    "list_habits",
    {
      description: "List the user's habits (id, name, icon).",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const { db } = await auth();
      const { data, error } = await db
        .from("habits")
        .select("id, name, icon")
        .order("createdAt", { ascending: true });
      if (error) throw new Error(error.message);
      return ok(data);
    }
  );

  server.registerTool(
    "get_contributions",
    {
      description:
        "Get habit completions (contributions) in a date range, inclusive. Defaults to the last 30 days.",
      inputSchema: {
        from: dateArg.optional(),
        to: dateArg.optional().describe("Defaults to today"),
        habit: z.string().optional().describe("Habit name or id to filter by"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ from, to, habit }) => {
      const { db } = await auth();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      let query = db
        .from("habitsLogs")
        .select("habitId, integerDate, habits(name)")
        .gte("integerDate", from ? toInt(from) : dateToInteger(start))
        .lte("integerDate", toInt(to))
        .order("integerDate", { ascending: true });
      if (habit) query = query.eq("habitId", (await findHabit(db, habit)).id);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return ok(
        data.map((log) => {
          const h = log.habits as { name: string } | { name: string }[] | null;
          return {
            date: toIso(log.integerDate),
            habitId: log.habitId,
            habit: (Array.isArray(h) ? h[0] : h)?.name ?? null,
          };
        })
      );
    }
  );

  server.registerTool(
    "log_habit",
    {
      description:
        "Mark a habit as done for a date (default today). Idempotent.",
      inputSchema: {
        habit: z.string().describe("Habit name or id"),
        date: dateArg.optional().describe("Defaults to today"),
      },
    },
    async ({ habit, date }) => {
      const { db, userId } = await auth();
      const { id, name } = await findHabit(db, habit);
      const integerDate = toInt(date);
      const { data: existing, error: checkError } = await db
        .from("habitsLogs")
        .select("id")
        .eq("habitId", id)
        .eq("userId", userId)
        .eq("integerDate", integerDate);
      if (checkError) throw new Error(checkError.message);
      if (!existing.length) {
        const { error } = await db
          .from("habitsLogs")
          .insert([{ habitId: id, userId, integerDate }]);
        if (error) throw new Error(error.message);
      }
      return ok({ habit: name, date: toIso(integerDate), done: true });
    }
  );

  server.registerTool(
    "unlog_habit",
    {
      description: "Remove a habit completion for a date (default today).",
      inputSchema: {
        habit: z.string().describe("Habit name or id"),
        date: dateArg.optional().describe("Defaults to today"),
      },
      annotations: { destructiveHint: true },
    },
    async ({ habit, date }) => {
      const { db, userId } = await auth();
      const { id, name } = await findHabit(db, habit);
      const integerDate = toInt(date);
      const { error } = await db
        .from("habitsLogs")
        .delete()
        .eq("habitId", id)
        .eq("userId", userId)
        .eq("integerDate", integerDate);
      if (error) throw new Error(error.message);
      return ok({ habit: name, date: toIso(integerDate), done: false });
    }
  );

  server.registerTool(
    "list_goals",
    {
      description:
        "List goals whose period contains a date (default today): weekly, monthly and semester goals.",
      inputSchema: {
        date: dateArg.optional().describe("Defaults to today"),
        type: z.enum(["weekly", "monthly", "semester"]).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ date, type }) => {
      const { db } = await auth();
      const day = date ?? today();
      let query = db
        .from("goals")
        .select(
          "id, title, description, type, periodStart, periodEnd, completed, linkedGoalId"
        )
        .lte("periodStart", day)
        .gte("periodEnd", day)
        .order("periodStart", { ascending: true })
        .order("sortOrder", { ascending: true });
      if (type) query = query.eq("type", type);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return ok(data);
    }
  );

  server.registerTool(
    "list_books",
    {
      description: "List the user's books.",
      inputSchema: { status: z.enum(["reading", "read"]).optional() },
      annotations: { readOnlyHint: true },
    },
    async ({ status }) => {
      const { db } = await auth();
      let query = db
        .from("books")
        .select("id, title, author, status, rating, notes, createdAt")
        .order("createdAt", { ascending: false });
      if (status) query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return ok(data);
    }
  );

  server.registerTool(
    "list_blogs",
    {
      description: "List the user's blog posts, newest first.",
      inputSchema: {
        includeContent: z
          .boolean()
          .optional()
          .describe("Include the post HTML content (default false)"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ includeContent }) => {
      const { db } = await auth();
      const { data, error } = await db
        .from("blogs")
        .select(
          `id, title, labelName, createdAt, updatedAt${includeContent ? ", content" : ""}`
        )
        .order("createdAt", { ascending: false });
      if (error) throw new Error(error.message);
      return ok(data);
    }
  );

  server.registerTool(
    "list_tasks",
    {
      description:
        "List the user's tasks: pending only by default, by due date.",
      inputSchema: {
        includeDone: z
          .boolean()
          .optional()
          .describe("Also include completed tasks (default false)"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ includeDone }) => {
      const { db } = await auth();
      let query = db
        .from("tasks")
        .select("id, title, kind, done, dueDate, completedAt, createdAt")
        .order("dueDate", { ascending: true, nullsFirst: false })
        .order("createdAt", { ascending: true });
      if (!includeDone) query = query.eq("done", false);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return ok(data);
    }
  );

  server.registerTool(
    "add_task",
    {
      description:
        "Add a task (short or long, default short), optionally with a due date.",
      inputSchema: {
        title: z.string().min(1).describe("Task title"),
        kind: z
          .enum(["short", "long"])
          .optional()
          .describe("short = quick task, long = bigger task (default short)"),
        dueDate: dateArg.optional(),
      },
    },
    async ({ title, kind = "short", dueDate }) => {
      const { db, userId } = await auth();
      const now = new Date().toISOString();
      const { data, error } = await db
        .from("tasks")
        .insert([
          { userId, title, kind, dueDate, createdAt: now, updatedAt: now },
        ])
        .select("id, title, kind, done, dueDate")
        .single();
      if (error) throw new Error(error.message);
      return ok(data);
    }
  );

  server.registerTool(
    "complete_task",
    {
      description: "Mark a pending task as done.",
      inputSchema: { task: taskArg },
    },
    ({ task }) => setTaskDone(task, true)
  );

  server.registerTool(
    "reopen_task",
    {
      description: "Mark a completed task as pending again.",
      inputSchema: { task: taskArg },
    },
    ({ task }) => setTaskDone(task, false)
  );

  server.registerTool(
    "delete_task",
    {
      description: "Permanently delete a task.",
      inputSchema: { task: taskArg },
      annotations: { destructiveHint: true },
    },
    async ({ task }) => {
      const { db } = await auth();
      const { id, title } = await findTask(db, task);
      const { error } = await db.from("tasks").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return ok({ id, title, deleted: true });
    }
  );

  return server;
}
