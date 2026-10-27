import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectBuildCache } from "./core.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() {
  const server = new McpServer({ name: "build-cache-mcp", version: "1.0.0" })
  server.tool("inspect_build_cache", "Summarize local build and cache footprint using size and age buckets without returning paths or file contents.", { project: z.string().min(1).max(1000).default(".") }, async (input) => { try { return text(format(await inspectBuildCache(input))) } catch (error) { return errorText(error) } })
  return server
}
