import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  VndbApiError,
  formatCharacter,
  formatRelease,
  formatVn,
  getReleases,
  getVn,
  searchCharacters,
  searchVns,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "vndb-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_vns",
    "Search the Visual Novel Database for visual novels. " +
      "Sortable by rating (default), popularity, released date, or title.",
    {
      query: z.string().describe("Search query, e.g. 'Muv-Luv' or 'nukige'"),
      sort: z
        .enum(["rating", "popularity", "released", "title"])
        .default("rating")
        .describe("Sort order"),
      results: z.number().int().min(1).max(15).default(8).describe("Max results"),
    },
    async ({ query, sort, results }) => {
      try {
        const vns = await searchVns(query, results, sort)
        if (vns.length === 0) return text(`No visual novels found for "${query}".`)
        const header = `Visual novels matching "${query}" (sorted by ${sort}):\n`
        return text(header + vns.map((v, i) => `${i + 1}. ${formatVn(v)}`).join("\n\n"))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_vn",
    "Get full details for a visual novel by its VNDB id (e.g. 'v17').",
    { id: z.string().describe("VNDB id like 'v17' or 'v311'") },
    async ({ id }) => {
      try {
        const vn = await getVn(id)
        if (!vn) return text(`No visual novel with id "${id}".`)
        return text(formatVn(vn))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_characters",
    "Search VNDB for characters by name or description text.",
    {
      query: z.string().describe("Character name or trait, e.g. 'Sakura' or 'tsundere'"),
      results: z.number().int().min(1).max(15).default(8).describe("Max results"),
    },
    async ({ query, results }) => {
      try {
        const chars = await searchCharacters(query, results)
        if (chars.length === 0) return text(`No characters found for "${query}".`)
        return text(
          `Characters matching "${query}":\n` +
            chars.map((c, i) => `${i + 1}. ${formatCharacter(c)}`).join("\n\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_vn_releases",
    "List all releases (platforms, languages, catalog numbers) for a visual novel.",
    { vnId: z.string().describe("VNDB id like 'v17'") },
    async ({ vnId }) => {
      try {
        const releases = await getReleases(vnId)
        if (releases.length === 0) return text(`No releases found for "${vnId}".`)
        return text(
          `Releases for ${vnId}:\n` +
            releases.map((r, i) => `${i + 1}. ${formatRelease(r)}`).join("\n\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof VndbApiError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
