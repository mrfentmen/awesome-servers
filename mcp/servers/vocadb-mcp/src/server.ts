import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, tagSearch } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "vocadb-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search VocaDB songs.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "artist_search",
    {
      title: "Artist search",
      description: "Search VocaDB for Vocaloid artists and producers by name, with type, picture flag and a short description.",
      inputSchema: z.object( { query: z.string().describe("Artist name, e.g. camellia."), limit: z.number().int().min(1).max(25).default(8).describe("Max results.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: artist_search ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_vocadb_artist_search", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "album_search",
    {
      title: "Album search",
      description: "Search VocaDB for albums by name, with the credited artist, disc type and release date.",
      inputSchema: z.object( { query: z.string().describe("Album name, e.g. exit."), limit: z.number().int().min(1).max(25).default(8).describe("Max results.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: album_search ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_vocadb_album_search", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "song_detail",
    {
      title: "Song detail",
      description: "Retrieve a song by id with duration, original version, tags and video links.",
      inputSchema: z.object( { id: z.number().int().min(1).max(2147483647).describe("Song id from search.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: song_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_vocadb_song_detail", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "artist_profile",
    {
      title: "Artist profile",
      description: "Retrieve an artist biography, translated names, release date and reference links by id.",
      inputSchema: z.object( { id: z.number().int().min(1).max(2147483647).describe("Artist id from artist search.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: artist_profile ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_vocadb_artist_profile", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "tag_search",
    {
      title: "Tag search",
      description: "Discover VocaDB genre and subject tags, their descriptions and usage counts.",
      inputSchema: z.object( { query: z.string().max(200).describe("Tag search terms."), limit: z.number().int().min(1).max(25).optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tagSearch(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
