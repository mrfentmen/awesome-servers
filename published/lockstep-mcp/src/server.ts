import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspect } from "./lockstep.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() {
  const server = new McpServer({ name: "lockstep-mcp", version: "1.0.0" })
  server.tool("inspect_reproducibility", "Inspect local package-manager lockfile presence and structural signals without returning dependency names or versions.", { project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }, async ({ project }) => { try { return text(format(await inspect(project))) } catch (error) { return errorText(error) } })
  return server
}
