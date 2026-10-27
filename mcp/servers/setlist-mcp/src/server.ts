import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  SetlistApiError,
  formatSetlist,
  getArtistByMbid,
  getSetlist,
  getSetlists,
  searchArtists,
  searchSetlistsBySong,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "setlist-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_artist",
    "Search Setlist.fm for an artist by name. Returns MusicBrainz IDs (mbid) " +
      "needed by the other tools.",
    { name: z.string().describe("Artist name, e.g. 'Radiohead' or 'Playboi Carti'") },
    async ({ name }) => {
      try {
        const results = await searchArtists(name)
        if (results.length === 0) {
          return text(`No artists found matching "${name}".`)
        }
        const lines = results.map(
          (r, i) =>
            `${i + 1}. ${r.artist.name}` +
            (r.artist.disambiguation ? ` (${r.artist.disambiguation})` : "") +
            ` — mbid: ${r.artist.mbid}`
        )
        return text(`Artists matching "${name}":\n${lines.join("\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_artist_setlists",
    "Fetch recent concert setlists for an artist by MusicBrainz ID.",
    {
      artistMbid: z.string().describe("MusicBrainz artist ID from search_artist"),
      page: z.number().int().min(1).default(1).describe("Page number"),
      year: z.number().int().optional().describe("Filter to a single year"),
    },
    async ({ artistMbid, page, year }) => {
      try {
        const artist = await getArtistByMbid(artistMbid)
        const res = await getSetlists(artistMbid, page, year)
        if (res.total === 0) {
          return text(`No setlists found for ${artist.name}.`)
        }
        const head = `${
          res.total
        } setlists on file for ${artist.name} (page ${page}). Latest ${res.setlist.length}:\n`
        const body = res.setlist
          .slice(0, 10)
          .map((s) => `• ${s.eventDate} @ ${s.venue?.name ?? "?"} — id ${s.id}`)
          .join("\n")
        return text(head + body)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_setlist_detail",
    "Get the full song-by-song setlist for a specific concert.",
    { setlistId: z.string().describe("Setlist ID (from get_artist_setlists)") },
    async ({ setlistId }) => {
      try {
        const s = await getSetlist(setlistId)
        return text(formatSetlist(s))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "count_song_plays",
    "Count how many times an artist has played a specific song live, " +
      "with a few example shows.",
    {
      artistMbid: z.string().describe("MusicBrainz artist ID"),
      songName: z.string().describe("Song title, e.g. 'Creep'"),
      maxPages: z.number().int().min(1).max(10).default(3).describe("Pages to scan (each = ~20 shows)"),
    },
    async ({ artistMbid, songName, maxPages }) => {
      try {
        const artist = await getArtistByMbid(artistMbid)
        let count = 0
        const examples: string[] = []
        for (let p = 1; p <= maxPages; p++) {
          const res = await searchSetlistsBySong(artistMbid, songName, p)
          for (const s of res.setlist) {
            count++
            if (examples.length < 5) {
              examples.push(
                `${s.eventDate} @ ${s.venue?.name ?? "?"} (id ${s.id})`
              )
            }
          }
          if (!res.setlist || res.setlist.length === 0) break
        }
        const head = `"${songName}" has been played live ${count}+ times by ${artist.name}.\n`
        const tail = examples.length
          ? `Example shows:\n${examples.map((x) => `• ${x}`).join("\n")}`
          : "No live plays found in the scanned pages."
        return text(head + tail)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof SetlistApiError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
