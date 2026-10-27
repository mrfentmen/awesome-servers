import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  LichessError,
  formatPlayer,
  formatPuzzle,
  getDailyPuzzle,
  getPlayer,
  getPuzzleById,
  getTopPlayers,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "lichess-mcp",
    version: "1.0.0",
  })

  server.tool(
    "get_daily_puzzle",
    "Get today's daily chess puzzle from Lichess with the FEN and solution.",
    {},
    async () => {
      try {
        const p = await getDailyPuzzle()
        if (!p) return text("No daily puzzle available right now.")
        return text(formatPuzzle(p))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_puzzle",
    "Get a specific Lichess puzzle by id.",
    { id: z.string().describe("Puzzle id, e.g. 'd4q3x'") },
    async ({ id }) => {
      try {
        const p = await getPuzzleById(id)
        if (!p) return text(`No puzzle "${id}".`)
        return text(formatPuzzle(p))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_player",
    "Get a Lichess player's stats — best rating, games played, account age.",
    { username: z.string().describe("Lichess username") },
    async ({ username }) => {
      try {
        const u = await getPlayer(username)
        if (!u) return text(`No Lichess user "${username}".`)
        return text(formatPlayer(u))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_top_players",
    "Top players by performance (blitz, bullet, classical, puzzle, etc.).",
    {
      perf: z
        .string()
        .default("blitz")
        .describe("Performance type: blitz, bullet, rapid, classical, puzzle, etc."),
      limit: z.number().int().min(1).max(20).default(10),
    },
    async ({ perf, limit }) => {
      try {
        const users = await getTopPlayers(perf, limit)
        if (users.length === 0) return text(`No top players for "${perf}".`)
        return text(
          `Top ${perf} players:\n` +
            users
              .map((u, i) => `${i + 1}. ${u.username}${u.title ? ` (${u.title})` : ""} — ${u.rating ?? "?"}`)
              .join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof LichessError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
