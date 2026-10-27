import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  BananaError,
  formatGame,
  formatMod,
  formatSearchResult,
  getGame,
  getGameMods,
  getMod,
  searchGames,
  searchMods,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "gamebanana-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_mods",
    "Search GameBanana for mods across all games.",
    { query: z.string().describe("Mod name, e.g. 'Brutal Doom' or 'randomizer'") },
    async ({ query }) => {
      try {
        const results = await searchMods(query)
        if (results.length === 0) return text(`No mods found for "${query}".`)
        return text(
          `Mods matching "${query}":\n` +
            results.map((r, i) => formatSearchResult(r, i + 1)).join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_mod",
    "Get a GameBanana mod page: description, author, downloads, size, category.",
    { id: z.number().int().describe("Mod id from search_mods or get_game_mods") },
    async ({ id }) => {
      try {
        const mod = await getMod(id)
        if (!mod) return text(`No mod with id ${id}.`)
        return text(formatMod(mod))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_games",
    "Search GameBanana for games by title.",
    { query: z.string().describe("Game title, e.g. 'Doom' or 'Half-Life'") },
    async ({ query }) => {
      try {
        const results = await searchGames(query)
        if (results.length === 0) return text(`No games found for "${query}".`)
        return text(
          `Games matching "${query}":\n` +
            results.map((r, i) => formatSearchResult(r, i + 1)).join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_game_mods",
    "List the latest mods for a game on GameBanana.",
    {
      gameId: z.number().int().describe("Game id from search_games"),
      limit: z.number().int().min(1).max(25).default(10).describe("Max mods"),
    },
    async ({ gameId, limit }) => {
      try {
        const game = await getGame(gameId)
        const mods = await getGameMods(gameId, limit)
        if (mods.length === 0) {
          return text(`No mods found for game ${gameId}.`)
        }
        const head = `${game?.name ?? `Game ${gameId}`} mods:\n`
        const body = mods
          .map(
            (m, i) =>
              `${i + 1}. ${m.name}${m.category ? ` [${m.category}]` : ""}${m.viewCount ? ` (${m.viewCount.toLocaleString()} views)` : ""}\n   ${m.url}`
          )
          .join("\n")
        return text(head + body)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof BananaError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
