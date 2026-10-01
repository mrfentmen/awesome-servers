import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, albumDetails } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "deezer-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Deezer tracks.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "artist_top_tracks",
    {
      title: "Artist top tracks",
      description: "Resolve an artist name to a Deezer artist id and list their top tracks with duration, album, popularity rank and track ids.",
      inputSchema: z.object( { artist: z.string().describe("Artist name, e.g. Daft Punk."), limit: z.number().describe("Max tracks.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: artist_top_tracks ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_deezer_artist_top_tracks", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "track_details",
    {
      title: "Track details",
      description: "Full Deezer record for one track: ISRC, release date, popularity rank, BPM, disc and track position, explicit flag, contributors, per country availability and preview link.",
      inputSchema: z.object( { track_id: z.number().describe("Deezer track id, e.g. 3135556.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: track_details ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_deezer_track_details", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "album_details",
    {
      title: "Album details",
      description: "Deezer album record with label, UPC, release date, fan count, genres, contributors and the full tracklist with durations and ids.",
      inputSchema: z.object( { album_id: z.number().describe("Deezer album id, e.g. 302127."), limit: z.number().describe("Max tracks listed.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await albumDetails(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  return server
}
