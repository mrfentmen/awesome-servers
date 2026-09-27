import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { artistDetails, artistSongs, search, songDetails } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "genius-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Genius for songs and artists.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "song_details",
    {
      title: "Song details",
      description: "Song pageviews, album and link.",
      inputSchema: z.object( { id: z.string().describe("Genius song id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await songDetails(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "artist_songs",
    {
      title: "Artist songs",
      description: "Popular songs of an artist.",
      inputSchema: z.object( { id: z.string().describe("Genius artist id."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await artistSongs(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "artist_details",
    {
      title: "Artist details",
      description: "Artist bio and link.",
      inputSchema: z.object( { id: z.string().describe("Genius artist id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await artistDetails(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
