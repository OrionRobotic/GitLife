// Hosted GitLife MCP endpoint (Streamable HTTP, stateless) for remote LLM clients.
// ponytail: single-user, one shared MCP_TOKEN plus the GITLIFE_EMAIL/PASSWORD
// account; per-user API tokens mapped to Supabase users are the upgrade path.
import { timingSafeEqual } from "node:crypto";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "../mcp/tools.js";

function authorized(req: Request) {
  const expected = process.env.MCP_TOKEN;
  if (!expected) return false; // fail closed
  // ?token= is a fallback for URL-only clients; URLs end up in logs, prefer the header.
  const given =
    req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1] ??
    new URL(req.url).searchParams.get("token") ??
    "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handler(req: Request) {
  if (!authorized(req)) {
    return Response.json(
      {
        jsonrpc: "2.0",
        error: { code: -32001, message: "Unauthorized" },
        id: null,
      },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
    );
  }
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless: new server + transport per request
    enableJsonResponse: true,
  });
  await createServer().connect(transport);
  return transport.handleRequest(req);
}

export { handler as GET, handler as POST, handler as DELETE };
