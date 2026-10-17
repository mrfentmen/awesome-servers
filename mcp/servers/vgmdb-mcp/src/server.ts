import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { VgmdbError, formatAlbumDetail, formatAlbumSearch, formatArtistDetail, formatArtistSearch, getAlbum, getArtist, searchAlbums, searchArtists, trackSearch } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "vgmdb-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_albums",
    {
      title: "Search albums",
      description: "Search for video game soundtrack albums by game or composer name. " +
      "Returns album ids for get_album.",
      inputSchema: z.object(
    { query: z.string().describe("e.g. 'Chrono Trigger OST' or 'NieR soundtrack'") }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        const albums = await searchAlbums(query)
        if (albums.length === 0) return text(`No albums found for "${query}".`)
        return text(
          `Albums matching "${query}":\n` +
            albums.map((a, i) => `${i + 1}. ${formatAlbumSearch(a)}`).join("\n\n")
        )
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_album",
    {
      title: "Get album",
      description: "Get full album details: full tracklist with timings, release date, genre.",
      inputSchema: z.object(
    { id: z.string().describe("Album numeric id from search_albums") }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        const album = await getAlbum(id)
        if (!album) return text(`No album with id "${id}".`)
        return text(formatAlbumDetail(album))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "search_artists",
    {
      title: "Search artists",
      description: "Search for video game composers / performers by name.",
      inputSchema: z.object(
    { query: z.string().describe("e.g. 'Yasunori Mitsuda' or 'Nobuo Uematsu'") }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        const artists = await searchArtists(query)
        if (artists.length === 0) return text(`No artists found for "${query}".`)
        return text(
          `Artists matching "${query}":\n` +
            artists.map((a, i) => `${i + 1}. ${formatArtistSearch(a)}`).join("\n")
        )
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_artist",
    {
      title: "Get artist",
      description: "Get a composer's/artist's discography (albums).",
      inputSchema: z.object(
    { id: z.string().describe("Artist numeric id from search_artists") }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        const artist = await getArtist(id)
        if (!artist) return text(`No artist with id "${id}".`)
        return text(formatArtistDetail(artist))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "album_census",
    {
      title: "Album census",
      description: "The shape of a soundtrack album's tracklist from the iTunes timings: total runtime, shortest, median, mean and longest track, how many tracks run over five minutes, the runtime per disc, the explicit count, the release years seen across the tracks, and the longest and shortest tracks by name.",
      inputSchema: z.object( { id: z.string().describe("Numeric album id from search_albums.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement census locally (paywall removed)
      try { return textError("Not yet implemented: census") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "composer_survey",
    {
      title: "Composer survey",
      description: "A composer's catalogue as a survey across the iTunes album entity: how many albums, their total and mean track counts, the release year span, the genre and storefront mix, the oldest and newest releases, the widest and narrowest, and every album id ranked by track count.",
      inputSchema: z.object( { query: z.string().describe("Composer or album search term, e.g. Yasunori Mitsuda."), limit: z.number().describe("Albums to fetch and list, 5-50.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement survey locally (paywall removed)
      try { return textError("Not yet implemented: survey") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "track_search",
    {
      title: "Track search",
      description: "Find a track by name and the album it sits on, with its track and disc number, length, release date, genre and explicitness, plus the distinct collection ids behind the matches. The album and artist searches cannot do this.",
      inputSchema: z.object( { query: z.string().describe("Track name to look for."), limit: z.number().describe("Matches to print, 3-25.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await trackSearch(args))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "storefront_availability",
    {
      title: "Storefront availability",
      description: "Where a soundtrack album is carried across iTunes country storefronts, with the price and currency in each: which storefronts list it at all, and how much the price moves between them. No other tool passes the iTunes country parameter or reads a price.",
      inputSchema: z.object( { id: z.string().describe("Numeric id from search_albums or search_artists."), storefronts: z.string().optional().describe("Two-letter codes to check, e.g. 'us gb jp'. Default: eight storefronts."), entity: z.enum(["album", "artist"]).optional().describe("What the id is. Default album.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement availability locally (paywall removed)
    try { return textError("Not yet implemented: availability") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof VgmdbError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
