import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search, artist, album, track, artist_top_tracks, chart_tracks, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "deezer-mcp", version: "1.0.0" })

  server.tool(
    "search",
    "Search tracks, artists or albums on Deezer",
    {
      query: z.string().min(2).describe("Search text, e.g. daft punk"),
      type: z.enum(["track", "artist", "album"]).default("track").describe("What to search for"),
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
    "artist",
    "Deezer artist profile",
    {
      artistId: z.number().int().min(1).describe("Deezer artist id, e.g. 27")
    },
    async (a) => {
      try {
        return text(await artist(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "album",
    "Album details with its track list",
    {
      albumId: z.number().int().min(1).describe("Deezer album id, e.g. 302127")
    },
    async (a) => {
      try {
        return text(await album(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "track",
    "Track details including BPM and duration",
    {
      trackId: z.number().int().min(1).describe("Deezer track id, e.g. 3135556")
    },
    async (a) => {
      try {
        return text(await track(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "artist_top_tracks",
    "An artist's most popular tracks",
    {
      artistId: z.number().int().min(1).describe("Deezer artist id"),
      limit: z.number().int().min(1).max(50).default(10).describe("Maximum tracks")
    },
    async (a) => {
      try {
        return text(await artist_top_tracks(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "chart_tracks",
    "Current Deezer top tracks chart",
    {
      limit: z.number().int().min(1).max(50).default(10).describe("Maximum tracks")
    },
    async (a) => {
      try {
        return text(await chart_tracks(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
