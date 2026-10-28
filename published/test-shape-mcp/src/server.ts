import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectTestShape } from "./core.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() {
  const server = new McpServer({ name: "test-shape-mcp", version: "1.0.0" })
  server.tool("inspect_test_shape", "Audit local test structure using aggregate assertions without returning test names, paths, or source text.", { project: z.string().min(1).max(1000).default(".") }, async (input) => { try { return text(format(await inspectTestShape(input))) } catch (error) { return errorText(error) } })
  return server
}
