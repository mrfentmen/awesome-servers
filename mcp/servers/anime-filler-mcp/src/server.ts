import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { ScrapeError, getShow, searchAnime, verdict } from "./scraper.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "anime-filler-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_anime",
    "Search for an anime on animefillerlist.com and return its slug " +
      "for the other tools.",
    { query: z.string().describe("Anime title, e.g. 'Naruto Shippuden' or 'One Piece'") },
    async ({ query }) => {
      try {
        const results = await searchAnime(query)
        if (results.length === 0) {
          return text(`No anime found for "${query}".`)
        }
        return text(
          `Anime matching "${query}":\n` +
            results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.url} (slug: ${r.slug})`).join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_episode_lists",
    "Get the full canon/filler episode breakdown for an anime by slug.",
    { slug: z.string().describe("Anime slug from search_anime, e.g. 'naruto-shippuden'") },
    async ({ slug }) => {
      try {
        const info = await getShow(slug)
        const head =
          `${info.title} — ${info.totalEpisodes ? info.totalEpisodes + " episodes" : "?"}` +
          (info.status ? `, ${info.status}` : "") +
          `\n${info.url}\n`
        if (info.categories.length === 0) {
          return text(head + "No episode categories could be parsed from the page.")
        }
        const body = info.categories
          .map((c) => `• ${c.label} (${c.episodes.length} eps): ${formatRanges(c.episodes)}`)
          .join("\n")
        const sample =
          info.episodes.length > 0
            ? `\n\nSample (first 8):\n` +
              info.episodes
                .slice(0, 8)
                .map((e) => `  ep${e.number} [${e.category}] ${e.title}`)
                .join("\n")
            : ""
        return text(head + "\n" + body + sample)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "is_episode_filler",
    "Ask whether a specific episode is filler or canon. The question every weeb asks.",
    {
      slug: z.string().describe("Anime slug from search_anime"),
      episode: z.number().int().min(1).describe("Episode number"),
    },
    async ({ slug, episode }) => {
      try {
        const info = await getShow(slug)
        return text(verdict(info, episode))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof ScrapeError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

/** Compact "1-17, 20-21, 35" representation of a sorted episode list. */
function formatRanges(nums: number[]): string {
  if (nums.length === 0) return "—"
  const parts: string[] = []
  let start = nums[0]
  let prev = nums[0]
  for (let i = 1; i <= nums.length; i++) {
    const n = nums[i]
    if (n === prev + 1) {
      prev = n
      continue
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`)
    start = prev = n
  }
  const s = parts.join(", ")
  return s.length > 160 ? s.slice(0, 157) + "…" : s
}
