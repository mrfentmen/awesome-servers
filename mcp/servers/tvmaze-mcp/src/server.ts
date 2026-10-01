import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_schedule, m0_search, m1_searchShows, m1_showEpisodes, m1_todaySchedule } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'tvmaze-mcp', version: '1.0.0' })
server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search shows.",
      inputSchema: z.object( { query: z.string().describe("Show name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_search(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "schedule",
    {
      title: "Schedule",
      description: "Schedule for a date and country.",
      inputSchema: z.object( { country: z.string().describe("ISO country like US.").optional(), date: z.string().describe("YYYY-MM-DD.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_schedule(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "search_shows",
    {
      title: "Search shows",
      description: "Search for TV shows by name.",
      inputSchema: z.object( { query: z.string().describe("Show name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_searchShows(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "show_episodes",
    {
      title: "Show episodes",
      description: "List episodes for a show by TVMaze ID.",
      inputSchema: z.object( { showId: z.number().describe("TVMaze show ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_showEpisodes(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "today_schedule",
    {
      title: "Today schedule",
      description: "List shows airing today.",
      inputSchema: z.object( { country: z.string().describe("Two letter country code.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_todaySchedule(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "show_lookup",
    {
      title: "Show lookup",
      description: "Resolve a show from an id another database holds - TheTVDB, IMDb or TVRage - into its TVMaze record, so you can skip a name search.",
      inputSchema: z.object( { tvdb: z.string().describe("TheTVDB show id, e.g. 121361.").optional(), imdb: z.string().describe("IMDb show id, e.g. tt0944947.").optional(), tvrage: z.string().describe("TVRage show id.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: show_lookup ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_tvmaze_show_lookup", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
