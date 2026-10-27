import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, hotspots, hygiene, recentChanges, summary } from "./forensics.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
const cwd = z.string().min(1).max(1000).default(".").describe("Local repository path. No network access is used.")

export function createServer() {
  const server = new McpServer({ name: "repo-forensics-mcp", version: "1.0.0" })
  server.tool("repository_summary", "Read branch, working-tree, remote names, and latest commit metadata from a local Git repository.", { cwd }, async ({ cwd: directory }) => { try { return text(format(await summary(directory))) } catch (error) { return errorText(error) } })
  server.tool("recent_changes", "List recent local Git commits with bounded output.", { cwd, limit: z.number().int().min(1).max(50).default(10) }, async ({ cwd: directory, limit }) => { try { return text(format(await recentChanges(directory, limit))) } catch (error) { return errorText(error) } })
  server.tool("file_hotspots", "Find files that appear most often in recent repository history. This is a heuristic for review focus, not a defect detector.", { cwd, limit: z.number().int().min(1).max(50).default(20) }, async ({ cwd: directory, limit }) => { try { return text(format(await hotspots(directory, limit))) } catch (error) { return errorText(error) } })
  server.tool("top_level_hygiene", "Check top-level large files, .gitignore presence, and working-tree dirtiness without reading file contents.", { cwd }, async ({ cwd: directory }) => { try { return text(format(await hygiene(directory))) } catch (error) { return errorText(error) } })
  return server
}
