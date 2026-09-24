import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listShows,
  listShowMedia,
  getShowStatsSummary,
  getShowEpisodeStats,
  getShowStatsTotals,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

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

  return server
}