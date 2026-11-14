import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { registerWardrobeTools } from "./tools.js"

export const VERSION = "1.0.0"

export function createServer(): McpServer {
  const server = new McpServer({
    name: "fashion-capsule-wardrobe-check-mcp",
    version: VERSION,
  })
  registerWardrobeTools(server)
  return server
}
