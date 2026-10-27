import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  AudiusError,
  formatTrack,
  formatUser,
  getUserTracks,
  searchTracks,
  searchUsers,
  trendingTracks,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "audius-mcp",
    version: "1.0.0",
  })

  server.tool(
    "trending_tracks",
    "Trending tracks on Audius — underground/independent music that isn't " +
      "on the mainstream charts. Filter by genre.",
    {
      genre: z.string().default("all").describe("Genre filter. Use exact Audius genre values, e.g. 'Hip-Hop/Rap', 'Electronic', 'Dubstep', 'Trap', or 'all' for every genre"),
      limit: z.number().int().min(1).max(25).default(8),
    },
    async ({ genre, limit }) => {
      try {
        const tracks = await trendingTracks(genre, limit)
        if (tracks.length === 0) return text(`No trending tracks${genre !== "all" ? ` in ${genre}` : ""}.`)
        return text(
          `Trending${genre !== "all" ? ` ${genre}` : ""} on Audius:\n\n` +
            tracks.map((t, i) => formatTrack(t, i)).join("\n\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_tracks",
    "Search tracks by title/artist keyword.",
    { query: z.string().describe("Search terms"), limit: z.number().int().min(1).max(25).default(8) },
    async ({ query, limit }) => {
      try {
        const tracks = await searchTracks(query, limit)
        if (tracks.length === 0) return text(`No tracks match "${query}".`)
        return text(`Tracks matching "${query}":\n\n${tracks.map((t, i) => formatTrack(t, i)).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_artists",
    "Search artists by handle or name.",
    { query: z.string().describe("Artist name or handle"), limit: z.number().int().min(1).max(25).default(8) },
    async ({ query, limit }) => {
      try {
        const users = await searchUsers(query, limit)
        if (users.length === 0) return text(`No artists match "${query}".`)
        return text(`Artists matching "${query}":\n\n${users.map((u, i) => formatUser(u, i)).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_artist_tracks",
    "Get an artist's uploaded tracks by user id.",
    { userId: z.string().describe("User id from search_artists"), limit: z.number().int().min(1).max(25).default(8) },
    async ({ userId, limit }) => {
      try {
        const tracks = await getUserTracks(userId, limit)
        if (tracks.length === 0) return text(`No tracks for user ${userId}.`)
        return text(`Tracks from user ${userId}:\n\n${tracks.map((t, i) => formatTrack(t, i)).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof AudiusError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
