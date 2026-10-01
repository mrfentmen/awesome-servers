import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "sourcegraph-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search public repositories for code.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_repos",
    {
      title: "Search repos",
      description: "Find indexed GitHub repositories matching a term, with star count, description and topics, instead of matching lines of code.",
      inputSchema: z.object( { query: z.string().describe("Repository search terms, e.g. \"zod\"."), limit: z.number().int().min(1).max(50).default(10).describe("Max repositories.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: search_repos ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_sourcegraph_search_repos", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "search_paths",
    {
      title: "Search paths",
      description: "Find file paths across indexed repositories matching a term, with the owning repository and its star count.",
      inputSchema: z.object( { query: z.string().describe("Path search terms, e.g. \"file:zod\"."), limit: z.number().int().min(1).max(50).default(10).describe("Max paths.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: search_paths ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_sourcegraph_search_paths", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
