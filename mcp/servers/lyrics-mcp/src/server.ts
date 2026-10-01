import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { getLyrics } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "lyrics-mcp", version: "1.0.0" })
  server.registerTool(
    "get_lyrics",
    {
      title: "Get lyrics",
      description: "Get lyrics for an artist and song title.",
      inputSchema: z.object( { artist: z.string().describe("Artist name."), song: z.string().describe("Song title.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await getLyrics(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_artist_metadata",
    {
      title: "Search artist metadata on MusicBrainz",
      description: "Look up artists by name in the MusicBrainz database: type, country, area, active years, tags and MusicBrainz id.",
      inputSchema: z.object({
        query: z.string().describe("Artist name to search for."),
        limit: z.number().int().min(1).max(10).optional().describe("How many artists to return (1-10, default 5)."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: search_artist_metadata ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_lyrics_search_artist_metadata", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "search_store_songs",
    {
      title: "Search songs in the iTunes store",
      description: "Search the public iTunes store catalogue for songs: album, release date, runtime, explicitness and a preview when one exists.",
      inputSchema: z.object({
        term: z.string().describe("Song, album or artist text to search for."),
        limit: z.number().int().min(1).max(10).optional().describe("How many songs to return (1-10, default 5)."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: search_store_songs ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_lyrics_search_store_songs", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
