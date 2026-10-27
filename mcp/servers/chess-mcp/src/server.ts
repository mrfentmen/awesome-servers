import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  ChessError,
  formatBoardRow,
  formatGame,
  formatPlayer,
  formatStats,
  getLeaderboards,
  getPlayer,
  getPlayerGames,
  getPlayerStats,
  getTitledPlayers,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "chess-mcp",
    version: "1.0.0",
  })

  server.tool(
    "get_player",
    "Get a chess.com player profile.",
    { username: z.string().describe("chess.com username, e.g. 'hikaru'") },
    async ({ username }) => {
      try {
        const p = await getPlayer(username)
        if (!p) return text(`No chess.com player "${username}".`)
        return text(formatPlayer(p))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_player_stats",
    "Get a player's ratings across time controls.",
    { username: z.string().describe("chess.com username") },
    async ({ username }) => {
      try {
        const stats = await getPlayerStats(username)
        const out = formatStats(stats)
        return text(out || `No rated stats for "${username}".`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_player_games",
    "Get a player's games for a month.",
    {
      username: z.string().describe("chess.com username"),
      year: z.number().int().min(2005).max(2100).describe("Year, e.g. 2026"),
      month: z.number().int().min(1).max(12).describe("Month, e.g. 6"),
      limit: z.number().int().min(1).max(50).default(10),
    },
    async ({ username, year, month, limit }) => {
      try {
        const games = await getPlayerGames(username, year, month)
        if (games.length === 0) return text(`No games for ${username} in ${year}-${String(month).padStart(2, "0")}.`)
        return text(`Games for ${username} in ${year}-${String(month).padStart(2, "0")}:\n${games.slice(0, limit).map((g, i) => formatGame(g, i)).join("\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_leaderboards",
    "Top players on chess.com by rating.",
    {},
    async () => {
      try {
        const boards = await getLeaderboards()
        const parts: string[] = []
        for (const key of ["daily", "rapid", "blitz", "bullet"]) {
          const rows = boards[key] ?? []
          if (rows.length) parts.push(`${key.toUpperCase()}:\n${rows.slice(0, 5).map(formatBoardRow).join("\n")}`)
        }
        return text(parts.join("\n\n") || "No leaderboard data.")
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_titled_players",
    "List players with a title like GM or IM.",
    { title: z.enum(["GM", "WGM", "IM", "WIM", "FM", "WFM", "NM", "CM", "WCM", "WNM"]).describe("Title abbreviation") },
    async ({ title }) => {
      try {
        const users = await getTitledPlayers(title)
        return text(`${title} players on chess.com (${users.length} total):\n${users.slice(0, 40).join(", ")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof ChessError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
