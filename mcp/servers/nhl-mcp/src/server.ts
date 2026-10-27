import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatGame, formatStanding, formatTeamStats, getSchedule, getStandings, getTeamStats, NhlError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "nhl-mcp",
    version: "1.0.0",
  })

  server.tool(
    "get_team_stats",
    "Season team stats: wins, losses, points, goals, special teams.",
    { season: z.string().default("20252026").describe("Season id like '20252026'"), limit: z.number().int().min(1).max(32).default(10) },
    async ({ season, limit }) => {
      try {
        const teams = await getTeamStats(season, limit)
        if (teams.length === 0) return text(`No team stats for season ${season}.`)
        return text(`NHL team stats ${season}:\n\n${teams.map((t) => formatTeamStats(t)).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_standings",
    "Current NHL standings for every team.",
    {},
    async () => {
      try {
        const rows = await getStandings()
        if (rows.length === 0) return text("No standings right now.")
        return text(`NHL standings:\n\n${rows.map((r, i) => formatStanding(r, i)).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_schedule",
    "Today's NHL games with scores where played.",
    {},
    async () => {
      try {
        const games = await getSchedule()
        if (games.length === 0) return text("No games on today's schedule.")
        return text(`NHL games today:\n${games.map((g) => `- ${formatGame(g)}`).join("\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof NhlError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
