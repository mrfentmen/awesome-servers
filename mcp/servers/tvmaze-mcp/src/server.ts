import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search_shows, show, schedule, cast, episode_by_number, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "tvmaze-mcp", version: "1.0.0" })

  server.tool(
    "search_shows",
    "Search TV shows by name",
    {
      query: z.string().min(2).describe("Show name"),
      limit: z.number().int().min(1).max(20).default(10).describe("Maximum shows")
    },
    async (a) => {
      try {
        return text(await search_shows(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "show",
    "Show details with its episode list",
    {
      showId: z.number().int().min(1).describe("TVmaze show id, e.g. 169")
    },
    async (a) => {
      try {
        return text(await show(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "schedule",
    "Shows airing on a given date in a country",
    {
      country: z.string().length(2).default("US").describe("Two-letter country code"),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Date YYYY-MM-DD, defaults to today")
    },
    async (a) => {
      try {
        return text(await schedule(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "cast",
    "Cast of a show with character names",
    {
      showId: z.number().int().min(1).describe("TVmaze show id")
    },
    async (a) => {
      try {
        return text(await cast(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "episode_by_number",
    "One episode by season and episode number",
    {
      showId: z.number().int().min(1).describe("TVmaze show id"),
      season: z.number().int().min(0).describe("Season number"),
      number: z.number().int().min(0).describe("Episode number")
    },
    async (a) => {
      try {
        return text(await episode_by_number(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
