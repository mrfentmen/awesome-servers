import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { SmogonError, formatPoke, getPokemon, getUsageStats, listAvailableMonths, searchDex } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "smogon-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_pokemon",
    {
      title: "Search pokemon",
      description: "Search the full national dex by name (fuzzy). Returns types, base " +
      "stats, abilities, and tier.",
      inputSchema: z.object(
    { query: z.string().describe("Pokemon name, e.g. 'garchomp' or 'rotom'") }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        const found = await searchDex(query, 10)
        if (found.length === 0) return text(`No Pokemon match "${query}".`)
        return text(
          `Pokemon matching "${query}":\n\n` + found.map((p) => formatPoke(p)).join("\n\n")
        )
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_pokemon",
    {
      title: "Get pokemon",
      description: "Get one Pokemon by exact name.",
      inputSchema: z.object(
    { name: z.string().describe("Exact Pokemon name, e.g. 'Garchomp'") }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try {
        const p = await getPokemon(name)
        if (!p) return text(`No Pokemon named "${name}".`)
        return text(formatPoke(p))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_usage_stats",
    {
      title: "Get usage stats",
      description: "Monthly Smogon usage stats for a format, e.g. gen9ou (OverUsed), " +
      "gen9uu, gen9ubers, gen9randombattle. Month is YYYY-MM.",
      inputSchema: z.object(
    {
      month: z.string().describe("Month, e.g. '2026-07'"),
      format: z.string().default("gen9ou").describe("Format slug, e.g. gen9ou"),
      top: z.number().int().min(1).max(50).default(15),
    }),
      annotations: READ_ONLY,
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
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "list_months",
    {
      title: "List months",
      description: "List the months with published Smogon usage statistics.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const months = await listAvailableMonths()
        if (months.length === 0) return text("No months found.")
        return text("Available usage months:\n" + months.join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "pokemon_by_type",
    {
      title: "Pokemon by type",
      description: "Every Pokemon in the national dex that has a given type, with its other type, Smogon tier and abilities.",
      inputSchema: z.object({ type: z.string().describe("Pokemon type, e.g. Fire."), limit: z.number().int().min(1).max(60).default(25) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement type locally (paywall removed)
    try { return textError("Not yet implemented: type") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "pokemon_by_ability",
    {
      title: "Pokemon by ability",
      description: "Every Pokemon in the national dex with a given ability, marking the ones where it is a hidden ability.",
      inputSchema: z.object({ ability: z.string().describe("Ability name, e.g. Intimidate."), limit: z.number().int().min(1).max(60).default(25) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement ability locally (paywall removed)
    try { return textError("Not yet implemented: ability") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof SmogonError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
