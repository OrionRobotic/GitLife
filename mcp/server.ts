// GitLife MCP server (stdio). stdout is the JSON-RPC channel: log only to stderr.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, missingEnv } from "./tools.js";

if (missingEnv().length) {
  console.error(
    `[gitlife-mcp] Missing environment variables: ${missingEnv().join(", ")}. Tool calls will fail until they are set.`
  );
}
await createServer().connect(new StdioServerTransport());
