import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatArtist, formatRecording, formatRelease, getArtist, MusicBrainzError, searchArtists, searchRecordings, searchReleases } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
export function createServer(): McpServer {
  const server = new McpServer({ name: "musicbrainz-mcp", version: "1.0.0" })
  server.registerTool(
    "search_artists",
    {
      title: "Search artists",
      description: "Search MusicBrainz artists by name or query.",
      inputSchema: z.object( { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => { try { const r = await searchArtists(query, limit); return text(`Artists for "${query}" (${r.count ?? 0} total):\n\n${(r.artists ?? []).map((a, i) => formatArtist(a, i)).join("\n\n")}`) } catch (e) { return textError(error(e)) } }
  )
  server.registerTool(
    "search_releases",
    {
      title: "Search releases",
      description: "Search albums and release editions in MusicBrainz.",
      inputSchema: z.object( { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => { try { const r = await searchReleases(query, limit); return text(`Releases for "${query}" (${r.count ?? 0} total):\n\n${(r.releases ?? []).map((x, i) => formatRelease(x, i)).join("\n\n")}`) } catch (e) { return textError(error(e)) } }
  )
  server.registerTool(
    "search_recordings",
    {
      title: "Search recordings",
      description: "Search MusicBrainz recordings and track metadata.",
      inputSchema: z.object( { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => { try { const r = await searchRecordings(query, limit); return text(`Recordings for "${query}" (${r.count ?? 0} total):\n\n${(r.recordings ?? []).map((x, i) => formatRecording(x, i)).join("\n\n")}`) } catch (e) { return textError(error(e)) } }
  )
  server.registerTool(
    "get_artist",
    {
      title: "Get artist",
      description: "Get one MusicBrainz artist by MBID.",
      inputSchema: z.object( { id: z.string().min(1) }),
      annotations: READ_ONLY,
    },
    async ({ id }) => { try { return text(formatArtist(await getArtist(id))) } catch (e) { return textError(error(e)) } }
  )
  server.registerTool(
    "search_release_groups",
    {
      title: "Search release groups",
      description: "Search MusicBrainz release groups, which collapse an artist's records across editions and reissues in a way individual release searches cannot.",
      inputSchema: z.object( { query: z.string().describe("Query, e.g. artist:radiohead."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: search_release_groups ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_musicbrainz_search_release_groups", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "search_labels",
    {
      title: "Search labels",
      description: "Search MusicBrainz record labels by name, with country and lifespan, which the artist, release and recording searches never touch.",
      inputSchema: z.object( { query: z.string().describe("Label name, e.g. parlophone."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: search_labels ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_musicbrainz_search_labels", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
export { MusicBrainzError }
