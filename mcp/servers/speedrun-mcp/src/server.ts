import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  SpeedrunError,
  formatGame,
  formatRecordCategory,
  getCategories,
  getLeaderboard,
  getRunner,
  getWorldRecords,
  searchGames,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "speedrun-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_games",
    "Search speedrun.com for a game. Returns game ids used by the other tools.",
    { query: z.string().describe("Game title, e.g. 'Ocarina of Time' or 'Super Mario 64'") },
    async ({ query }) => {
      try {
        const games = await searchGames(query)
        if (games.length === 0) return text(`No speedrun.com games match "${query}".`)
        return text(`Games matching "${query}":\n${games.map((g, i) => formatGame(g, i)).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_world_records",
    "Get the current world records for a game — every category with the " +
      "top 3 runs each.",
    { gameId: z.string().describe("Game id from search_games") },
    async ({ gameId }) => {
      try {
        const records = await getWorldRecords(gameId)
        if (records.length === 0) return text(`No records found for game ${gameId}.`)
        return text(`World records for ${gameId}:\n\n${records.map(formatRecordCategory).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_leaderboard",
    "Get a leaderboard for a specific game category.",
    {
      gameId: z.string().describe("Game id from search_games"),
      categoryId: z.string().describe("Category id from get_categories"),
      top: z.number().int().min(1).max(25).default(10),
    },
    async ({ gameId, categoryId, top }) => {
      try {
        const lb = await getLeaderboard(gameId, categoryId, top)
        if (!lb || lb.entries.length === 0)
          return text(`No leaderboard rows for ${gameId}/${categoryId}.`)
        return text(
          `Leaderboard ${lb.category} (${lb.game}) top ${lb.entries.length}:\n` +
            lb.entries
              .map(
                (r) =>
                  `  ${r.place}. ${r.player} — ${r.time}${r.date ? ` (${r.date})` : ""}${
                    r.video ? `\n     ${r.video}` : ""
                  }`
              )
              .join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_categories",
    "List a game's speedrun categories (Any%, 100%, glitchless, etc.).",
    { gameId: z.string().describe("Game id from search_games") },
    async ({ gameId }) => {
      try {
        const cats = await getCategories(gameId)
        if (cats.length === 0) return text(`No categories for ${gameId}.`)
        return text(
          `Categories for ${gameId}:\n` +
            cats
              .map((c, i) => `${i + 1}. ${c.name} [${c.id}] (${c.type}${c.players ? `, ${c.players.value}p` : ""})`)
              .join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_runner",
    "Look up a speedrunner profile by user id.",
    { userId: z.string().describe("User id (e.g. from a record's player link)") },
    async ({ userId }) => {
      try {
        const u = await getRunner(userId)
        if (!u) return text(`No speedrun.com user "${userId}".`)
        return text(
          `${u.name} [${u.id}]\n` +
            `${u.weblink ?? ""}\n` +
            `${u.location ? `Location: ${u.location}\n` : ""}` +
            `${u.signup ? `Signed up: ${u.signup}\n` : ""}` +
            `${u.runCount !== undefined ? `Runs on profile: ${u.runCount}` : ""}`
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof SpeedrunError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
