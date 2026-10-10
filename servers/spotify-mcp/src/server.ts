import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, search, getArtist, getAlbum, getTrack, artistTop, artistAlbums, newReleases, getEpisode, getShow, browseCategories, artistIdentity, musicCharts } from "./api.js"
import { premiumRequired } from "./license.js"

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
      description: "Search the Spotify catalog for tracks, artists or albums.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        type: z.string().describe("track,artist,album combo (default all).").optional(),
        limit: z.string().describe("Max results (default 5, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, type, limit }) => {
      try {
        return text(await search(query, type, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_artist",
    {
      title: "Get artist",
      description: "Artist profile: genres, popularity and follower count.",
      inputSchema: z.object({
        artist_id: z.string().describe("Spotify artist ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ artist_id }) => {
      try {
        return text(await getArtist(artist_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_album",
    {
      title: "Get album",
      description: "Album details plus its track list and release date.",
      inputSchema: z.object({
        album_id: z.string().describe("Spotify album ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ album_id }) => {
      try {
        return text(await getAlbum(album_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_track",
    {
      title: "Get track",
      description: "Track details.",
      inputSchema: z.object({
        track_id: z.string().describe("Spotify track ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ track_id }) => {
      try {
        return text(await getTrack(track_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "artist_top",
    {
      title: "Artist top tracks",
      description: "Top tracks (US).",
      inputSchema: z.object({
        artist_id: z.string().describe("Spotify artist ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ artist_id }) => {
      try {
        return text(await artistTop(artist_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "artist_albums",
    {
      title: "Artist albums",
      description: "Album list.",
      inputSchema: z.object({
        artist_id: z.string().describe("Spotify artist ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ artist_id }) => {
      try {
        return text(await artistAlbums(artist_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "new_releases",
    {
      title: "New releases",
      description: "Fresh albums.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await newReleases(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_episode",
    {
      title: "Get episode",
      description: "Podcast episode.",
      inputSchema: z.object({
        episode_id: z.string().describe("Episode ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ episode_id }) => {
      try {
        return text(await getEpisode(episode_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_show",
    {
      title: "Get show",
      description: "Podcast show.",
      inputSchema: z.object({
        show_id: z.string().describe("Show ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ show_id }) => {
      try {
        return text(await getShow(show_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "browse_categories",
    {
      title: "Categories",
      description: "Browse genres.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await browseCategories(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "artist_identity",
    {
      title: "Artist identity",
      description:
        "Resolves an artist name against MusicBrainz: the disambiguation hint, aliases, life span, begin area, gender and tags, the release-group count broken down by type, and every other entry sharing the name so two same-named performers are not merged by accident.",
      inputSchema: z.object({
        name: z.string().describe("Artist name to resolve, e.g. Radiohead, Sade, Air."),
        limit: z.number().describe("Max competing entries shown, 1-15. Defaults to 5.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: artist_identity ----
    const paywallMessage = await premiumRequired("artist_identity")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await artistIdentity(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "music_charts",
    {
      title: "Music charts",
      description:
        "Deezer's editorial charts for tracks, albums and artists: rank, duration, explicit flag, preview availability, release date, track and fan counts, optionally filtered by genre. No Spotify credentials needed.",
      inputSchema: z.object({
        kind: z.string().describe("Which chart: tracks, albums or artists. Defaults to tracks.").optional(),
        limit: z.number().describe("Entries per chart, 1-50. Defaults to 10.").optional(),
        genre: z.string().describe("Optional genre name, e.g. rock, jazz, rap.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await musicCharts(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}