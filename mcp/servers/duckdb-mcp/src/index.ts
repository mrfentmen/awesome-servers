#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { createServer } from "./server.js"

async function main(): Promise<void> {
  const server = createServer()
  await server.connect(new StdioServerTransport())
  console.error("duckdb-mcp running on stdio")
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
