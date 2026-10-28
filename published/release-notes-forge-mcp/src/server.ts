import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, summarizeReleaseHistory } from "./core.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() {
  const server = new McpServer({ name: "release-notes-forge-mcp", version: "1.0.0" })
  server.tool("summarize_release_history", "Summarize local Git release shape without returning commit messages, paths, hashes, or remotes.", { cwd: z.string().min(1).max(1000).default(".") }, async (input) => { try { return text(format(await summarizeReleaseHistory(input))) } catch (error) { return errorText(error) } })
  return server
}
