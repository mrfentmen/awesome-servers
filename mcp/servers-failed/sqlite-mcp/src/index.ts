import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { createServer } from "./server.js"

async function main(): Promise<void> {
  const dbPath = process.argv[2] ?? process.env.SQLITE_DB_PATH
  if (!dbPath) {
    console.error("Usage: sqlite-mcp <db-file>  (or set SQLITE_DB_PATH)")
    process.exit(1)
  }
  const server = createServer(dbPath)
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("MCP server running on stdio")
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
