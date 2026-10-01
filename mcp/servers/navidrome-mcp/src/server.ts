import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatAlbum, listArtists, NavidromeError, ping, searchLibrary, streamUrl } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "navidrome-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "ping",
    {
      title: "Ping server",
      description: "Check the Navidrome server answers. Set NAVIDROME_URL for non-default hosts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await ping())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_artists",
    {
      title: "List artists",
      description: "Artists in the library. Needs NAVIDROME_USER + NAVIDROME_PASSWORD.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listArtists()
        if (rows.length === 0) return text("No artists.")
        return text(rows.map((a, i) => `${i + 1}. [${a.id}] ${a.name}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_library",
    {
      title: "Search library",
      description: "Search artists and albums by name.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'miles davis'"),
        limit: z.number().int().min(1).max(50).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const { artists, albums } = await searchLibrary(query, limit)
        const parts: string[] = []
        if (artists.length) parts.push(`Artists:\n${artists.map((a, i) => `${i + 1}. [${a.id}] ${a.name}`).join("\n")}`)
        if (albums.length) parts.push(`Albums:\n${albums.map((a, i) => formatAlbum(a, i)).join("\n")}`)
        if (!parts.length) return text(`Nothing found for "${query}".`)
        return text(parts.join("\n\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "stream_url",
    {
      title: "Stream URL",
      description: "Build an authenticated stream URL for a song id (no fetch).",
      inputSchema: z.object({
        song_id: z.string().describe("Song id from search results"),
      }),
      annotations: READ_ONLY,
    },
    async ({ song_id }) => {
      try {
        if (!song_id.trim()) return textError("Error: song id is empty.")
        return text(streamUrl(song_id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof NavidromeError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
