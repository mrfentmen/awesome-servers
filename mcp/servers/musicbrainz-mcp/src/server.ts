import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatArtist, formatRecording, formatRelease, getArtist, MusicBrainzError, searchArtists, searchRecordings, searchReleases } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
export function createServer(): McpServer {
  const server = new McpServer({ name: "musicbrainz-mcp", version: "1.0.0" })
  server.tool("search_artists", "Search MusicBrainz artists by name or query.", { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }, async ({ query, limit }) => { try { const r = await searchArtists(query, limit); return text(`Artists for "${query}" (${r.count ?? 0} total):\n\n${(r.artists ?? []).map((a, i) => formatArtist(a, i)).join("\n\n")}`) } catch (e) { return text(error(e)) } })
  server.tool("search_releases", "Search albums and release editions in MusicBrainz.", { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }, async ({ query, limit }) => { try { const r = await searchReleases(query, limit); return text(`Releases for "${query}" (${r.count ?? 0} total):\n\n${(r.releases ?? []).map((x, i) => formatRelease(x, i)).join("\n\n")}`) } catch (e) { return text(error(e)) } })
  server.tool("search_recordings", "Search MusicBrainz recordings and track metadata.", { query: z.string().min(1), limit: z.number().int().min(1).max(25).default(10) }, async ({ query, limit }) => { try { const r = await searchRecordings(query, limit); return text(`Recordings for "${query}" (${r.count ?? 0} total):\n\n${(r.recordings ?? []).map((x, i) => formatRecording(x, i)).join("\n\n")}`) } catch (e) { return text(error(e)) } })
  server.tool("get_artist", "Get one MusicBrainz artist by MBID.", { id: z.string().min(1) }, async ({ id }) => { try { return text(formatArtist(await getArtist(id))) } catch (e) { return text(error(e)) } })
  return server
}
export { MusicBrainzError }
