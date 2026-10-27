import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  SmogonError,
  formatPoke,
  getPokemon,
  getUsageStats,
  listAvailableMonths,
  searchDex,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "smogon-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_pokemon",
    "Search the full national dex by name (fuzzy). Returns types, base " +
      "stats, abilities, and tier.",
    { query: z.string().describe("Pokemon name, e.g. 'garchomp' or 'rotom'") },
    async ({ query }) => {
      try {
        const found = await searchDex(query, 10)
        if (found.length === 0) return text(`No Pokemon match "${query}".`)
        return text(
          `Pokemon matching "${query}":\n\n` + found.map((p) => formatPoke(p)).join("\n\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_pokemon",
    "Get one Pokemon by exact name.",
    { name: z.string().describe("Exact Pokemon name, e.g. 'Garchomp'") },
    async ({ name }) => {
      try {
        const p = await getPokemon(name)
        if (!p) return text(`No Pokemon named "${name}".`)
        return text(formatPoke(p))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_usage_stats",
    "Monthly Smogon usage stats for a format, e.g. gen9ou (OverUsed), " +
      "gen9uu, gen9ubers, gen9randombattle. Month is YYYY-MM.",
    {
      month: z.string().describe("Month, e.g. '2026-07'"),
      format: z.string().default("gen9ou").describe("Format slug, e.g. gen9ou"),
      top: z.number().int().min(1).max(50).default(15),
    },
    async ({ month, format, top }) => {
      try {
        const rows = await getUsageStats(month, format, top)
        if (rows.length === 0)
          return text(`No usage data for ${format} in ${month}. Check list_months.`)
        return text(
          `Top ${rows.length} Pokemon in ${format.toUpperCase()} (${month}):\n` +
            rows
              .map(
                (r) =>
                  `${r.rank}. ${r.name} ${r.usagePct.toFixed(2)}% (${r.raw.toLocaleString()} raw)`
              )
              .join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_months",
    "List the months with published Smogon usage statistics.",
    {},
    async () => {
      try {
        const months = await listAvailableMonths()
        if (months.length === 0) return text("No months found.")
        return text("Available usage months:\n" + months.join("\n"))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof SmogonError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
