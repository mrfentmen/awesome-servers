import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { categories, search } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "emoji-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Find emoji matching a keyword.",
      inputSchema: z.object( { query: z.string().describe("Keyword like smile or heart."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "categories",
    {
      title: "Categories",
      description: "List emoji categories.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await categories(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "emoji_info",
    {
      title: "Emoji info",
      description: "Which groups one emoji belongs to, working from the character backwards, which the search tool cannot do.",
      inputSchema: z.object( { emoji: z.string().describe("A single emoji character, like 🐶.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: emoji_info ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_emoji_emoji_info", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "catalogue_stats",
    {
      title: "Catalogue stats",
      description: "How the emoji catalogue is made up: every group with its entry count and how many are distinct, and the real number of unique emoji once the overlapping groups are folded together.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: catalogue_stats ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_emoji_catalogue_stats", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
