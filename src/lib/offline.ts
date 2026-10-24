// Local-first layer under supabase-js (used as its custom `fetch`).
// PostgREST reads are stored on this computer (Cache API) and answered from it
// when offline; writes are applied to that local copy at once and queued in an
// outbox that is replayed to Supabase, in order, whenever we are online.
// Conflicts: last write wins. Auth and Storage requests pass straight through.
// ponytail: filter support covers what the app uses (eq/neq/gt/gte/lt/lte/is/in/or);
// add operators here if a service starts using others.

type Row = Record<string, unknown>;
type Pending = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
};

const CACHE = "gitlife-data-v1";
const OUTBOX_KEY = "gitlife-outbox";
const REST = "/rest/v1/";
const OBJECT = "application/vnd.pgrst.object+json";
const RESERVED = new Set([
  "select",
  "order",
  "limit",
  "offset",
  "on_conflict",
  "columns",
  "__accept",
]);

// ── Pure helpers (tested in tests/offline.test.ts) ────────────────────────────

const unquote = (v: string) =>
  v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1) : v;

function compare(a: unknown, b: string): number {
  const x = String(a);
  if (x !== "" && !isNaN(Number(x)) && !isNaN(Number(b)))
    return Number(x) - Number(b);
  const [dx, db] = [Date.parse(x), Date.parse(b)];
  if (!isNaN(dx) && !isNaN(db) && /\d{4}-\d{2}-\d{2}/.test(b)) return dx - db;
  return x < b ? -1 : x > b ? 1 : 0;
}

/** Does `row[col]` satisfy a PostgREST condition like "eq.5" or "in.(a,b)"? */
export function satisfies(value: unknown, condition: string): boolean {
  const dot = condition.indexOf(".");
  const op = condition.slice(0, dot);
  const arg = unquote(condition.slice(dot + 1));
  switch (op) {
    case "eq":
      return value != null && compare(value, arg) === 0;
    case "neq":
      return value == null || compare(value, arg) !== 0;
    case "gt":
      return value != null && compare(value, arg) > 0;
    case "gte":
      return value != null && compare(value, arg) >= 0;
    case "lt":
      return value != null && compare(value, arg) < 0;
    case "lte":
      return value != null && compare(value, arg) <= 0;
    case "is":
      return arg === "null" ? value == null : String(value) === arg;
    case "in":
      return arg
        .replace(/^\(|\)$/g, "")
        .split(",")
        .map(unquote)
        .some((v) => value != null && compare(value, v) === 0);
    default:
      return true; // unknown operator: don't hide rows
  }
}

/** Split "a.eq.1,b.gte.\"x,y\"" on top-level commas. */
function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quoted = false;
  let cur = "";
  for (const ch of s) {
    if (ch === '"') quoted = !quoted;
    if (!quoted && ch === "(") depth++;
    if (!quoted && ch === ")") depth--;
    if (!quoted && depth === 0 && ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  return cur ? [...out, cur] : out;
}

/** Does a row match every filter in a PostgREST query string? */
export function matches(row: Row, params: URLSearchParams): boolean {
  for (const [key, value] of params) {
    if (RESERVED.has(key)) continue;
    if (key === "or") {
      const ok = splitTop(value.replace(/^\(|\)$/g, "")).some((part) => {
        const dot = part.indexOf(".");
        return satisfies(row[part.slice(0, dot)], part.slice(dot + 1));
      });
      if (!ok) return false;
    } else if (!satisfies(row[key], value)) return false;
  }
  return true;
}

function sortRows(rows: Row[], order: string | null) {
  if (!order) return rows;
  const keys = order.split(",").map((k) => {
    const [col, dir = "asc", nulls] = k.split(".");
    return { col, desc: dir === "desc", nullsFirst: nulls === "nullsfirst" };
  });
  return [...rows].sort((a, b) => {
    for (const { col, desc, nullsFirst } of keys) {
      const [x, y] = [a[col], b[col]];
      if (x == null || y == null) {
        if (x == y) continue;
        return (x == null) === nullsFirst ? -1 : 1;
      }
      const c = compare(x, String(y));
      if (c !== 0) return desc ? -c : c;
    }
    return 0;
  });
}

/**
 * Apply a write to one cached result set (`rows` came from `entryUrl`).
 * Returns the new result set and the rows the write affected.
 */
export function applyWrite(
  rows: Row[],
  entryUrl: string,
  write: {
    method: string;
    url: string;
    body: Row[] | Row | null;
    upsert: boolean;
  }
): { rows: Row[]; affected: Row[] } {
  const entry = new URL(entryUrl).searchParams;
  const target = new URL(write.url).searchParams;
  if (write.method === "POST") {
    const incoming = ([] as Row[]).concat(write.body ?? []);
    const conflict = (target.get("on_conflict") ?? "id").split(",");
    let next = rows;
    for (const row of incoming) {
      const same = (r: Row) => conflict.every((c) => r[c] === row[c]);
      const existing = write.upsert ? next.find(same) : undefined;
      next = existing
        ? next.map((r) => (r === existing ? { ...r, ...row } : r))
        : matches(row, entry)
          ? [...next, row]
          : next;
    }
    return {
      rows: sortRows(
        next.filter((r) => matches(r, entry)),
        entry.get("order")
      ),
      affected: incoming,
    };
  }
  const hit = rows.filter((r) => matches(r, target));
  if (write.method === "DELETE")
    return { rows: rows.filter((r) => !hit.includes(r)), affected: hit };
  // PATCH
  const patched = rows.map((r) =>
    hit.includes(r) ? { ...r, ...(write.body as Row) } : r
  );
  return {
    rows: sortRows(
      patched.filter((r) => matches(r, entry)),
      entry.get("order")
    ),
    affected: patched.filter((r, i) => hit.includes(rows[i])),
  };
}

// ── Storage ───────────────────────────────────────────────────────────────────

let getToken: () => Promise<string | undefined> = async () => undefined;
export const setTokenGetter = (fn: typeof getToken) => (getToken = fn);

const loadOutbox = (): Pending[] => {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? "[]");
  } catch {
    return [];
  }
};
const saveOutbox = (items: Pending[]) => {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Offline outbox not saved:", e);
  }
};

const cacheKey = (url: string, accept: string | null) => {
  const u = new URL(url);
  u.searchParams.set("__accept", accept?.includes(OBJECT) ? "object" : "list");
  return u.toString();
};

const json = (body: unknown, status = 200) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Wipe the local copy (e.g. on sign out). */
export async function clearLocal() {
  saveOutbox([]);
  if (typeof caches !== "undefined") await caches.delete(CACHE);
}

/** Apply a write to every cached result set of its table. */
async function applyLocal(p: Pending): Promise<Row[]> {
  const cache = await caches.open(CACHE);
  const table = new URL(p.url).pathname;
  const now = new Date().toISOString();
  const parsed = p.body ? JSON.parse(p.body) : null;
  const write = {
    method: p.method,
    url: p.url,
    // New rows get the timestamps the database would set.
    body:
      p.method === "POST"
        ? ([] as Row[])
            .concat(parsed ?? [])
            .map((r) => ({ createdAt: now, updatedAt: now, ...r }))
        : parsed,
    upsert: (p.headers["prefer"] ?? "").includes("merge-duplicates"),
  };
  const affected = new Map<unknown, Row>();
  for (const req of await cache.keys()) {
    if (new URL(req.url).pathname !== table) continue;
    const res = await cache.match(req);
    const data = await res?.json();
    if (!Array.isArray(data)) continue; // single-object results refresh online
    const out = applyWrite(data, req.url, write);
    out.affected.forEach((r) => affected.set(r.id ?? affected.size, r));
    await cache.put(req, json(out.rows));
  }
  return write.method === "POST" ? write.body : [...affected.values()];
}

// ── Sync ──────────────────────────────────────────────────────────────────────

let flushing: Promise<boolean> | null = null;

/** Replay the outbox to Supabase. Resolves true once it is empty. */
export function flush(): Promise<boolean> {
  // .finally runs after the assignment, even when drain() finishes immediately.
  flushing ??= drain()
    .catch(() => false)
    .finally(() => (flushing = null));
  return flushing;
}

async function drain(): Promise<boolean> {
  let items = loadOutbox();
  while (items.length > 0) {
    const p = items[0];
    const token = await getToken();
    let res: Response;
    try {
      res = await fetch(p.url, {
        method: p.method,
        headers: {
          ...p.headers,
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: p.body,
      });
    } catch {
      return false; // still offline
    }
    if (res.status >= 500) return false; // try again later
    if (!res.ok)
      console.error("Dropped unsyncable change:", p, await res.text());
    items = loadOutbox().slice(1);
    saveOutbox(items);
  }
  return true;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => flush());
  setInterval(() => loadOutbox().length && flush(), 30_000);
}

// ── fetch ─────────────────────────────────────────────────────────────────────

export async function offlineFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const url = input instanceof Request ? input.url : String(input);
  const method = (init.method ?? "GET").toUpperCase();
  if (!url.includes(REST) || typeof caches === "undefined")
    return fetch(input, init);

  const headers: Record<string, string> = {};
  new Headers(init.headers).forEach((v, k) => (headers[k] = v));
  const accept = headers["accept"] ?? null;

  if (method === "GET" || method === "HEAD") {
    const key = cacheKey(url, accept);
    const synced = await flush(); // local changes first, then fresh data
    if (synced && navigator.onLine) {
      try {
        const res = await fetch(input, {
          ...init,
          signal: init.signal ?? AbortSignal.timeout(8000),
        });
        if (res.ok && method === "GET")
          await (await caches.open(CACHE)).put(key, res.clone());
        return res;
      } catch {
        // offline: fall back to the local copy
      }
    }
    const cached = await (await caches.open(CACHE)).match(key);
    return cached ?? json({ message: "Offline and not synced yet" }, 503);
  }

  // Writes: give new rows an id so the local copy and Supabase agree on it.
  // Not for upserts: an id there would overwrite the existing row's id.
  let body = typeof init.body === "string" ? init.body : null;
  const upsert = (headers["prefer"] ?? "").includes("merge-duplicates");
  if (method === "POST" && body && !upsert) {
    const rows = JSON.parse(body);
    const withId = (r: Row) => ({ id: crypto.randomUUID(), ...r });
    body = JSON.stringify(
      Array.isArray(rows) ? rows.map(withId) : withId(rows)
    );
  }
  const { authorization: _auth, ...rest } = headers;
  const pending: Pending = { url, method, headers: rest, body };

  if (loadOutbox().length === 0 && navigator.onLine) {
    try {
      const res = await fetch(input, { ...init, body });
      if (res.ok) await applyLocal(pending);
      return res;
    } catch {
      // offline: queue below
    }
  }
  saveOutbox([...loadOutbox(), pending]);
  const rows = await applyLocal(pending);
  if (!(headers["prefer"] ?? "").includes("return=representation"))
    return json(undefined, method === "POST" ? 201 : 204);
  return accept?.includes(OBJECT)
    ? json(rows[0] ?? null)
    : json(rows, method === "POST" ? 201 : 200);
}
