import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { config } from "./config.js"
import { registerTools } from "./tools.js"

export const VERSION = "1.0.0"

export function createServer(): McpServer {
  const server = new McpServer({ name: config.name, version: VERSION })
  registerTools(server)
  return server
}
