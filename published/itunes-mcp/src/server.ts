import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search, lookup, top_songs, top_apps, customer_reviews, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "itunes-mcp", version: "1.0.0" })

  server.tool(
    "search",
    "Search apps, music, podcasts, books or films",
    {
      term: z.string().min(2).describe("Search text"),
      media: z.enum(["all", "movie", "podcast", "music", "musicVideo", "audiobook", "shortFilm", "tvShow", "software", "ebook"]).default("all").describe("Media type"),
      limit: z.number().int().min(1).max(25).default(10).describe("Maximum results")
    },
    async (a) => {
      try {
        return text(await search(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "lookup",
    "Look up an item by iTunes id",
    {
      id: z.number().int().min(1).describe("iTunes id, e.g. 136975"),
      entity: z.enum(["song", "album", "artist", "software", "podcast"]).default("song").describe("Entity type")
    },
    async (a) => {
      try {
        return text(await lookup(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "top_songs",
    "Current iTunes top songs for a country",
    {
      country: z.string().length(2).default("us").describe("Two-letter country code"),
      limit: z.number().int().min(1).max(50).default(10).describe("Maximum songs")
    },
    async (a) => {
      try {
        return text(await top_songs(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "top_apps",
    "Top free or grossing apps for a country",
    {
      country: z.string().length(2).default("us").describe("Two-letter country code"),
      kind: z.enum(["topfreeapplications", "topgrossingapplications", "toppaidapplications"]).default("topfreeapplications").describe("Chart type"),
      limit: z.number().int().min(1).max(50).default(10).describe("Maximum apps")
    },
    async (a) => {
      try {
        return text(await top_apps(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "customer_reviews",
    "Most recent App Store reviews for an app",
    {
      appId: z.number().int().min(1).describe("App id, e.g. 284882215"),
      country: z.string().length(2).default("us").describe("Two-letter store country"),
      limit: z.number().int().min(1).max(50).default(10).describe("Maximum reviews")
    },
    async (a) => {
      try {
        return text(await customer_reviews(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
