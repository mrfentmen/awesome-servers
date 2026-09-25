import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  topArtists,
  topTracks,
  artistInfo,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "lastfm-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "top_artists",
    {
      title: "Top artists",
      description: "Global top artists.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await topArtists(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "top_tracks",
    {
      title: "Top tracks",
      description: "Global top tracks.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await topTracks(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "artist_info",
    {
      title: "Artist info",
      description: "Bio, stats and similar artists.",
      inputSchema: z.object({
        artist: z.string().describe("Artist name.")
      }),
      annotations: READ_ONLY,
    },
    async ({ artist }) => {
      try {
        return text(await artistInfo(artist));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}