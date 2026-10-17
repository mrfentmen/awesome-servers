import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { SpeedrunError, formatGame, formatRecordCategory, getCategories, getLeaderboard, getRunner, getWorldRecords, searchGames } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "speedrun-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_games",
    {
      title: "Search games",
      description: "Search speedrun.com for a game. Returns game ids used by the other tools.",
      inputSchema: z.object(
    { query: z.string().describe("Game title, e.g. 'Ocarina of Time' or 'Super Mario 64'") }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        const games = await searchGames(query)
        if (games.length === 0) return text(`No speedrun.com games match "${query}".`)
        return text(`Games matching "${query}":\n${games.map((g, i) => formatGame(g, i)).join("\n\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_world_records",
    {
      title: "Get world records",
      description: "Get the current world records for a game — every category with the " +
      "top 3 runs each.",
      inputSchema: z.object(
    { gameId: z.string().describe("Game id from search_games") }),
      annotations: READ_ONLY,
    },
    async ({ gameId }) => {
      try {
        const records = await getWorldRecords(gameId)
        if (records.length === 0) return text(`No records found for game ${gameId}.`)
        return text(`World records for ${gameId}:\n\n${records.map(formatRecordCategory).join("\n\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_leaderboard",
    {
      title: "Get leaderboard",
      description: "Get a leaderboard for a specific game category.",
      inputSchema: z.object(
    {
      gameId: z.string().describe("Game id from search_games"),
      categoryId: z.string().describe("Category id from get_categories"),
      top: z.number().int().min(1).max(25).default(10),
    }),
      annotations: READ_ONLY,
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
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_categories",
    {
      title: "Get categories",
      description: "List a game's speedrun categories (Any%, 100%, glitchless, etc.).",
      inputSchema: z.object(
    { gameId: z.string().describe("Game id from search_games") }),
      annotations: READ_ONLY,
    },
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
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_runner",
    {
      title: "Get runner",
      description: "Look up a speedrunner profile by user id.",
      inputSchema: z.object(
    { userId: z.string().describe("User id (e.g. from a record's player link)") }),
      annotations: READ_ONLY,
    },
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
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "latest_runs",
    {
      title: "Latest runs",
      description: "The most recently submitted verified runs on speedrun.com, with game, category, runner and time.",
      inputSchema: z.object( { limit: z.number().int().min(1).max(20).default(5).describe("How many runs.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement runs locally (paywall removed)
    try { return textError("Not yet implemented: runs") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "player_pbs",
    {
      title: "Player pbs",
      description: "A speedrun.com user's personal bests: game, category, place and time for each.",
      inputSchema: z.object( { userId: z.string().describe("User id, e.g. j4pe1ywj"), limit: z.number().int().min(1).max(20).default(5).describe("How many personal bests.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement pbs locally (paywall removed)
    try { return textError("Not yet implemented: pbs") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof SpeedrunError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
