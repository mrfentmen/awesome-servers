import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  comparePodcasts,
  errorMessage,
  latestEpisodes,
  podcastCharts,
  podcastDetails,
  podcastStats,
  searchEpisodes,
  searchPodcasts,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "simplecast-mcp",
    version: "2.0.0",
  })

  server.registerTool(
    "search_podcasts",
    {
      title: "Search podcasts",
      description: "Search the Apple Podcasts catalogue by name or topic and get each show's episode count, genre, Apple id and RSS feed URL. No API key needed.",
      inputSchema: z.object({
        query: z.string().describe("Search term, for example technology news."),
        limit: z.number().describe("How many shows to return, 1 to 50. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchPodcasts({ query, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_episodes",
    {
      title: "Search episodes",
      description: "Search podcast episode titles across the whole Apple Podcasts catalogue and return the show, date and length of each match.",
      inputSchema: z.object({
        query: z.string().describe("Words to find in episode titles."),
        limit: z.number().describe("How many episodes to return, 1 to 50. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchEpisodes({ query, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "podcast_charts",
    {
      title: "Podcast charts",
      description: "Apple Podcasts top chart for a country, with rank, publisher and genre for every show.",
      inputSchema: z.object({
        country: z.string().describe('Two-letter country code such as "us", "gb" or "de". Defaults to us.').optional(),
        limit: z.number().describe("How many chart entries, 1 to 100. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ country, limit }) => {
      try {
        return text(await podcastCharts({ country, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "podcast_details",
    {
      title: "Podcast details",
      description: "Look up one show by Apple id or by name and get its publisher, genre, episode count, latest release and a live check of its RSS feed.",
      inputSchema: z.object({
        podcastId: z.number().describe("Apple Podcasts collection id, for example 1434243584.").optional(),
        name: z.string().describe("Show name to look up instead of an id.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ podcastId, name }) => {
      try {
        return text(await podcastDetails({ podcastId, name }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "latest_episodes",
    {
      title: "Latest episodes",
      description: "Read any podcast RSS feed and list its newest episodes with publication date, length and audio URL.",
      inputSchema: z.object({
        feedUrl: z.string().describe("Podcast RSS feed URL."),
        count: z.number().describe("How many episodes to list, 1 to 25. Defaults to 5.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ feedUrl, count }) => {
      try {
        return text(await latestEpisodes({ feedUrl, count }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "podcast_stats",
    {
      title: "Podcast stats",
      description: "Analyse a podcast feed: episode count, first and latest episode, average length, publishing cadence and whether the show is overdue.",
      inputSchema: z.object({
        feedUrl: z.string().describe("Podcast RSS feed URL."),
      }),
      annotations: READ_ONLY,
    },
    async ({ feedUrl }) => {
      try {
        return text(await podcastStats({ feedUrl }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "compare_podcasts",
    {
      title: "Compare podcasts",
      description: "Compare two podcast feeds side by side on episode count, latest episode, average length and publishing cadence.",
      inputSchema: z.object({
        feedA: z.string().describe("First podcast RSS feed URL."),
        feedB: z.string().describe("Second podcast RSS feed URL."),
      }),
      annotations: READ_ONLY,
    },
    async ({ feedA, feedB }) => {
      try {
        return text(await comparePodcasts({ feedA, feedB }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
