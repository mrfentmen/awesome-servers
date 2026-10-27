import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectDependencyDrift } from "./drift.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "dependency-drift-mcp", version: "1.0.0" })
  server.tool(
    "inspect_dependency_drift",
    "Summarize local dependency manifest and lockfile drift without returning package names, versions, paths, or file contents.",
    { project: z.string().min(1).max(1000).default(".").describe("Local project directory; no URLs or commands") },
    async ({ project }) => {
      try { return text(format(await inspectDependencyDrift(project))) }
      catch (error) { return errorText(error) }
    },
  )
  return server
}
