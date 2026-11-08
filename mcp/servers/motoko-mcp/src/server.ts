import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { config } from "./config.js"
import { registerLanguageTools } from "./core.js"

export function createServer(): McpServer {
  const server = new McpServer({ name: `${config.slug}-mcp`, version: config.version })
  registerLanguageTools(server, config)
  return server
}
