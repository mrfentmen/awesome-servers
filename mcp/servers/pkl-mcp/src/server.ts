import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { format } from "./format.js"
import { registerFormatTools } from "./core.js"

export const VERSION = "1.0.0"

export function createServer(): McpServer {
  const server = new McpServer({ name: `${format.slug}-mcp`, version: VERSION })
  registerFormatTools(server, format)
  return server
}
