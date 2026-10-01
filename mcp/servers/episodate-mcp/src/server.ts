import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, show, popularShows } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "episodate-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search TV shows.",
      inputSchema: z.object( { query: z.string().describe("Show name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "show",
    {
      title: "Show",
      description: "Get show details by id.",
      inputSchema: z.object( { id: z.number().describe("Show id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await show(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "popular_shows",
    {
      title: "Popular shows",
      description: "The most popular TV shows on Episodate, 20 per page, with status, network and start date.",
      inputSchema: z.object( { page: z.number().describe("Page number, starting at 1. Defaults to 1.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await popularShows(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "episode_guide",
    {
      title: "Episode guide",
      description: "Every episode of one show, grouped by season, marking which have aired and which are still to come.",
      inputSchema: z.object( { show: z.string().describe("Permalink like breaking-bad, or the numeric id from search."), season: z.number().describe("Limit to one season number. Defaults to every season.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: episode_guide ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_episodate_episode_guide", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "season_overview",
    {
      title: "Season overview",
      description: "Per season episode counts, date ranges and how many have aired, plus the show's runtime, genres and rating.",
      inputSchema: z.object( { show: z.string().describe("Permalink like breaking-bad, or the numeric id from search.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: season_overview ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_episodate_season_overview", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
