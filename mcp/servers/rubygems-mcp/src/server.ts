import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { gemInfo, searchGems, gemDependencies } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "rubygems-mcp", version: "1.0.0" })
  server.registerTool(
    "gem_info",
    {
      title: "Gem info",
      description: "Get details for a Ruby gem.",
      inputSchema: z.object( { name: z.string().describe("Gem name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await gemInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_gems",
    {
      title: "Search gems",
      description: "Search gems.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchGems(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "gem_versions",
    {
      title: "Gem versions",
      description: "Full RubyGems release history for a gem: every version with release date, per-version downloads, platform, required Ruby version and licences, plus the all-time download total.",
      inputSchema: z.object( { name: z.string().describe("Gem name."), limit: z.number().int().min(1).max(60).default(15), includePrerelease: z.boolean().default(true) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: gem_versions ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_rubygems_gem_versions", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "recent_gems",
    {
      title: "Recent gems",
      description: "The gems most recently released or updated anywhere on RubyGems, with author and download counts.",
      inputSchema: z.object( { limit: z.number().int().min(1).max(50).default(15) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: recent_gems ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_rubygems_recent_gems", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "gem_dependencies",
    {
      title: "Gem dependencies",
      description: "What a gem declares it needs: runtime and development dependencies with their exact version requirements.",
      inputSchema: z.object( { name: z.string().describe("Gem name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await gemDependencies(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
