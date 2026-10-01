import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, listShows, listShowMedia, getShowStatsSummary, getShowEpisodeStats, getShowStatsTotals, listStatsShows, downloadCountries, listeningApps } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer(): McpServer {
  const server = new McpServer({
    name: "blubrry-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_shows",
    {
      title: "List shows",
      description: "List podcast shows on the Blubrry account.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listShows());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_show_media",
    {
      title: "List show media",
      description: "Unpublished and recently published media files for a show.",
      inputSchema: z.object({
        keyword: z.string().describe("Program keyword identifying the show."),
      }),
      annotations: READ_ONLY,
    },
    async ({ keyword }) => {
      try {
        return text(await listShowMedia(keyword));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_show_stats_summary",
    {
      title: "Show stats summary",
      description: "Overall download summary for a show.",
      inputSchema: z.object({
        keyword: z.string().describe("Program keyword identifying the show."),
      }),
      annotations: READ_ONLY,
    },
    async ({ keyword }) => {
      try {
        return text(await getShowStatsSummary(keyword));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_show_episode_stats",
    {
      title: "Show episode stats",
      description: "Episode-level download counts for a show.",
      inputSchema: z.object({
        keyword: z.string().describe("Program keyword identifying the show."),
      }),
      annotations: READ_ONLY,
    },
    async ({ keyword }) => {
      try {
        return text(await getShowEpisodeStats(keyword));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_show_stats_totals",
    {
      title: "Show stats totals",
      description: "Lifetime download totals for a show.",
      inputSchema: z.object({
        keyword: z.string().describe("Program keyword identifying the show."),
      }),
      annotations: READ_ONLY,
    },
    async ({ keyword }) => {
      try {
        return text(await getShowStatsTotals(keyword));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_stats_shows",
    {
      title: "Shows with statistics access",
      description: "Every show on the account that exposes statistics, with its program keyword, program id and RSS feed URL.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await listStatsShows(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "download_countries",
    {
      title: "Downloads by country",
      description: "Where a show's downloads come from: Blubrry's country breakdown by mobile country code, ranked with share of total.",
      inputSchema: z.object({
        keyword: z.string().describe("Show program keyword"),
        limit: z.string().describe("Max countries (default 25, max 100).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: download_countries ----
    const paywallMessage = await premiumRequired("download_countries")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await downloadCountries(args.keyword, args.limit)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "listening_apps",
    {
      title: "Listening apps",
      description: "Which apps and browsers a show is played in, with download share per app and per client class (mobile, desktop and so on).",
      inputSchema: z.object({
        keyword: z.string().describe("Show program keyword"),
        limit: z.string().describe("Max apps (default 25, max 100).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: listening_apps ----
    const paywallMessage = await premiumRequired("listening_apps")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await listeningApps(args.keyword, args.limit)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}