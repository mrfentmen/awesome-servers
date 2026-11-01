import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  KkboxError,
  formatAlbum,
  formatArtist,
  formatCategory,
  formatChart,
  formatPaging,
  formatPlaylist,
  formatTrack,
  getAlbum,
  getAlbumTracks,
  getArtist,
  getArtistAlbums,
  getCategories,
  getCharts,
  getFeaturedPlaylists,
  getNewReleases,
  getPlaylist,
  getTrack,
  search,
  territory,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

const limitShape = z.number().int().min(1).max(50).default(20)
const offsetShape = z.number().int().min(0).default(0)

export function createServer(): McpServer {
  const server = new McpServer({
    name: "kkbox-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search",
    `Search the KKBOX catalogue (territory ${territory()}). Returns tracks, albums, artists or playlists depending on type.`,
    {
      q: z.string().min(1).describe("Search keywords, e.g. 'Eason Chan' or 'Hello'"),
      type: z.enum(["track", "album", "artist", "playlist"]).default("track").describe("What to search for"),
      limit: limitShape,
      offset: offsetShape,
    },
    async ({ q, type, limit, offset }) => {
      try {
        const result = await search(q, type, limit, offset)

        if (type === "track") {
          const items = result.tracks?.data ?? []
          if (items.length === 0) return text(`No track results for "${q}" in ${territory()}.`)
          return text(
            `Track results for "${q}" in ${territory()}:\n\n` +
              items.map((t, i) => formatTrack(t, i)).join("\n\n") +
              formatPaging(result.tracks?.paging)
          )
        }

        if (type === "album") {
          const items = result.albums?.data ?? []
          if (items.length === 0) return text(`No album results for "${q}" in ${territory()}.`)
          return text(
            `Album results for "${q}" in ${territory()}:\n\n` +
              items.map((a, i) => formatAlbum(a, i)).join("\n\n") +
              formatPaging(result.albums?.paging)
          )
        }

        if (type === "artist") {
          const items = result.artists?.data ?? []
          if (items.length === 0) return text(`No artist results for "${q}" in ${territory()}.`)
          return text(
            `Artist results for "${q}" in ${territory()}:\n\n` +
              items.map((a, i) => `${i + 1}. ${formatArtist(a)}`).join("\n\n") +
              formatPaging(result.artists?.paging)
          )
        }

        const playlists = result.playlists?.data ?? []
        if (playlists.length === 0) return text(`No playlist results for "${q}" in ${territory()}.`)
        return text(
          `Playlist results for "${q}" in ${territory()}:\n\n` +
            playlists.map((p, i) => formatPlaylist(p, i)).join("\n\n") +
            formatPaging(result.playlists?.paging)
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_track",
    "Get one track by id: name, artists, album and duration.",
    { track_id: z.string().min(1).describe("KKBOX track id") },
    async ({ track_id }) => {
      try {
        return text(formatTrack(await getTrack(track_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_album",
    "Get one album by id: artist, release date and track count.",
    { album_id: z.string().min(1).describe("KKBOX album id") },
    async ({ album_id }) => {
      try {
        return text(formatAlbum(await getAlbum(album_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_artist",
    "Get one artist by id.",
    { artist_id: z.string().min(1).describe("KKBOX artist id") },
    async ({ artist_id }) => {
      try {
        return text(formatArtist(await getArtist(artist_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_playlist",
    "Get one curated playlist by id: title, description and link.",
    { playlist_id: z.string().min(1).describe("KKBOX playlist id") },
    async ({ playlist_id }) => {
      try {
        return text(formatPlaylist(await getPlaylist(playlist_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_artist_albums",
    "List the albums of one artist.",
    {
      artist_id: z.string().min(1).describe("KKBOX artist id"),
      limit: limitShape,
      offset: offsetShape,
    },
    async ({ artist_id, limit, offset }) => {
      try {
        const result = await getArtistAlbums(artist_id, limit, offset)
        const albums = result.data ?? []
        if (albums.length === 0) return text(`No albums for artist ${artist_id}.`)
        return text(
          `Albums by ${artist_id}:\n\n${albums.map((a, i) => formatAlbum(a, i)).join("\n\n")}${formatPaging(result.paging)}`
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_album_tracks",
    "List the tracks on one album, in track order.",
    {
      album_id: z.string().min(1).describe("KKBOX album id"),
      limit: z.number().int().min(1).max(100).default(30),
      offset: offsetShape,
    },
    async ({ album_id, limit, offset }) => {
      try {
        const result = await getAlbumTracks(album_id, limit, offset)
        const tracks = result.data ?? []
        if (tracks.length === 0) return text(`No tracks on album ${album_id}.`)
        return text(
          `Tracks on ${album_id}:\n\n${tracks.map((t, i) => formatTrack(t, i)).join("\n\n")}${formatPaging(result.paging)}`
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_charts",
    `List the current KKBOX charts for ${territory()}, with their top tracks.`,
    {},
    async () => {
      try {
        const charts = (await getCharts()).data ?? []
        if (charts.length === 0) return text(`No charts available for ${territory()}.`)
        return text(`KKBOX charts (${territory()}):\n\n${charts.map((c, i) => formatChart(c, i)).join("\n\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_featured_playlists",
    `Curated featured playlists for ${territory()}.`,
    { limit: limitShape, offset: offsetShape },
    async ({ limit, offset }) => {
      try {
        const result = await getFeaturedPlaylists(limit, offset)
        const playlists = result.data ?? []
        if (playlists.length === 0) return text(`No featured playlists for ${territory()}.`)
        return text(
          `Featured playlists (${territory()}):\n\n${playlists
            .map((p, i) => formatPlaylist(p, i))
            .join("\n\n")}${formatPaging(result.paging)}`
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_new_releases",
    `New release categories and albums for ${territory()}.`,
    {},
    async () => {
      try {
        const result = await getNewReleases()
        const albums = result.data ?? []
        if (albums.length === 0) return text(`No new releases for ${territory()}.`)
        return text(
          `New releases (${territory()}):\n\n${albums.map((a, i) => formatAlbum(a, i)).join("\n\n")}${formatPaging(result.paging)}`
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_categories",
    `Top-level music categories and their subcategories for ${territory()}.`,
    {},
    async () => {
      try {
        const categories = (await getCategories()).data ?? []
        if (categories.length === 0) return text(`No categories for ${territory()}.`)
        return text(`Categories (${territory()}):\n\n${categories.map((c, i) => formatCategory(c, i)).join("\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof KkboxError) return `Error: ${e.message}`
  if (e instanceof Error && e.name === "TimeoutError") return "Error: KKBOX request timed out"
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
