import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, trending } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "kitsu-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search anime by title.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "trending",
    {
      title: "Trending",
      description: "Trending anime.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await trending(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "anime_details",
    {
      title: "Anime details",
      description: "One Kitsu anime by id: alternate titles, genres, format, episode count, air dates, rating ranks, user count and synopsis.",
      inputSchema: z.object( { id: z.string().describe("Numeric Kitsu anime id, e.g. 1 for Cowboy Bebop.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: anime_details ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_kitsu_anime_details", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "manga_search",
    {
      title: "Manga search",
      description: "Search Kitsu's manga library by title, showing chapter and volume counts, rating and status.",
      inputSchema: z.object( { query: z.string().describe("Manga title to search for."), limit: z.number().int().min(1).max(20).default(10).describe("Max results.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: manga_search ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_kitsu_manga_search", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
