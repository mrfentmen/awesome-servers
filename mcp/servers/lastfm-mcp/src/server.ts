import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, topArtists, topTracks, artistInfo, musicbrainzArtist, artistDiscography, coverArt } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "lastfm-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "top_artists",
    {
      title: "Top artists",
      description: "Artists with the most listeners worldwide.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await topArtists(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "top_tracks",
    {
      title: "Top tracks",
      description: "Tracks with the most listeners worldwide.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await topTracks(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "artist_info",
    {
      title: "Artist info",
      description: "Bio, stats and similar artists.",
      inputSchema: z.object({
        artist: z.string().describe("Artist name.")
      }),
      annotations: READ_ONLY,
    },
    async ({ artist }) => {
      try {
        return text(await artistInfo(artist));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "musicbrainz_artist",
    {
      title: "MusicBrainz artist",
      description: "The canonical artist record from MusicBrainz: MBID, match score, type, country, life span, aliases and tags. No Last.fm key needed.",
      inputSchema: z.object({ artist: z.string().describe("Artist name, e.g. Radiohead"), limit: z.number().int().min(1).max(10).default(3).describe("How many matches to print (default 3, max 10).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: musicbrainz_artist ----
      const paywallMessage = await premiumRequired("musicbrainz_artist")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await musicbrainzArtist(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "artist_discography",
    {
      title: "Artist discography",
      description: "An artist's release groups from MusicBrainz with first-release dates and types, the discography view Last.fm never returns, with each MBID ready for cover_art.",
      inputSchema: z.object({ artist: z.string().describe("Artist name, e.g. Nirvana"), limit: z.number().int().min(1).max(50).default(10).describe("How many release groups to print (default 10, max 50).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: artist_discography ----
      const paywallMessage = await premiumRequired("artist_discography")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await artistDiscography(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "cover_art",
    {
      title: "Cover art",
      description: "Cover art for a MusicBrainz release from the Cover Art Archive: every image, which side is the front, the full size URL and all published thumbnail sizes.",
      inputSchema: z.object({ mbid: z.string().describe("MusicBrainz release group id, e.g. 1b022e01-4da6-387b-8658-8678046e4cef") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: cover_art ----
      const paywallMessage = await premiumRequired("cover_art")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(await coverArt(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}