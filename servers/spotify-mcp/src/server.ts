import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { artistAlbums, artistTop, browseCategories, formatAlbum, formatArtist, formatItem, formatTrack, getAlbum, getArtist, getEpisode, getShow, getTrack, newReleases, searchCatalog, SpotifyError } from "./api.js"

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
      description: "Search Spotify albums, artists, tracks.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'daft punk'"),
        kind: z.enum(["album", "artist", "track"]).default("track"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, kind, limit }) => {
      try {
        const results = await searchCatalog(query, kind, limit)
        if (results.length === 0) return text(`Nothing found for "${query}".`)
        return text(`Spotify ${kind}s for "${query}":\n\n${results.map((it, i) => formatItem(it, i)).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_album",
    {
      title: "Get album",
      description: "One Spotify album: artists, date, tracks, label, link.",
      inputSchema: z.object({
        id: z.string().describe("Spotify album id (use search to find it)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(formatAlbum(await getAlbum(id)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_artist",
    {
      title: "Get artist",
      description: "One Spotify artist: followers, genres, link.",
      inputSchema: z.object({
        id: z.string().describe("Spotify artist id (use search to find it)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(formatArtist(await getArtist(id)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_track",
    {
      title: "Get track",
      description: "One Spotify track: artists, album, length, popularity.",
      inputSchema: z.object({
        id: z.string().describe("Spotify track id (use search to find it)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(formatTrack(await getTrack(id)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "artist_top",
    {
      title: "Artist top tracks",
      description: "Top tracks for an artist (US).",
      inputSchema: z.object({
        id: z.string().describe("Spotify artist id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(await artistTop(id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "artist_albums",
    {
      title: "Artist albums",
      description: "Albums of an artist.",
      inputSchema: z.object({
        id: z.string().describe("Spotify artist id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(await artistAlbums(id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "new_releases",
    {
      title: "New releases",
      description: "Fresh album releases.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(50).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await newReleases(limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_episode",
    {
      title: "Get episode",
      description: "One podcast episode (name, show, length).",
      inputSchema: z.object({
        id: z.string().describe("Spotify episode id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        const e = await getEpisode(id)
        return text(`[${String(e.id)}] ${String(e.name ?? "?")} — ${String((e.show as { name?: string } | undefined)?.name ?? "?")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_show",
    {
      title: "Get show",
      description: "One podcast show.",
      inputSchema: z.object({
        id: z.string().describe("Spotify show id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        const s = await getShow(id)
        return text(`[${String(s.id)}] ${String(s.name ?? "?")} — ${String(s.publisher ?? "?")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "browse_categories",
    {
      title: "Browse categories",
      description: "Spotify browse genres and moods.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(50).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await browseCategories(limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof SpotifyError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
