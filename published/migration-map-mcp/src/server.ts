import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectMigrationMap } from "./core.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() {
  const server = new McpServer({ name: "migration-map-mcp", version: "1.0.0" })
  server.tool("inspect_migration_map", "Find local migration numbering gaps and rollback pairing signals without returning SQL, paths, or migration names.", { project: z.string().min(1).max(1000).default(".") }, async (input) => { try { return text(format(await inspectMigrationMap(input))) } catch (error) { return errorText(error) } })
  return server
}
