import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  search,
  getArtist,
  getAlbum,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "spotify-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search",
    {
      title: "Search catalog",
      description: "Tracks, artists, albums.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        type: z.string().describe("track,artist,album combo (default all).").optional(),
        limit: z.string().describe("Max results (default 5, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, type, limit }) => {
      try {
        return text(await search(query, type, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_artist",
    {
      title: "Get artist",
      description: "Artist profile.",
      inputSchema: z.object({
        artist_id: z.string().describe("Spotify artist ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ artist_id }) => {
      try {
        return text(await getArtist(artist_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_album",
    {
      title: "Get album",
      description: "Album details and tracks.",
      inputSchema: z.object({
        album_id: z.string().describe("Spotify album ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ album_id }) => {
      try {
        return text(await getAlbum(album_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}