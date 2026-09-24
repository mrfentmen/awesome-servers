import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatGame, gameOdds, listSports, OddsError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "theoddsapi-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_sports",
    {
      title: "List sports",
      description: "Sports and leagues with API keys (soccer_epl, americanfootball_nfl...).",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listSports()
        if (rows.length === 0) return text("No sports.")
        return text(rows.map((s, i) => `${i + 1}. [${s.key}] ${s.title ?? ""}${s.group ? ` (${s.group})` : ""}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "game_odds",
    {
      title: "Game odds",
      description: "Upcoming games with bookmaker moneyline odds.",
      inputSchema: z.object({
        sport: z.string().describe("Sport key, e.g. 'soccer_epl' (use list_sports)"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ sport, limit }) => {
      try {
        const rows = await gameOdds(sport, limit)
        if (rows.length === 0) return text(`No upcoming games for ${sport}.`)
        return text(rows.map((g, i) => formatGame(g, i)).join("\n\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof OddsError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
