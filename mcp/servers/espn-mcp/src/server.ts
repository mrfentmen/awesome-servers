import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { scoreboard } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "espn-mcp", version: "1.0.0" })

  server.tool(
    "scoreboard",
    "Current or dated scores from ESPN: teams, scores and game status for any sport and league.",
    {
      sport: z.string().min(1).describe('ESPN sport, e.g. "football", "basketball", "baseball", "soccer", "hockey"'),
      league: z.string().min(1).describe('ESPN league, e.g. "nfl", "nba", "mlb", "nhl", "eng.1"'),
      dates: z
        .string()
        .regex(/^\d{8}$/)
        .optional()
        .describe("Optional day as YYYYMMDD; omit for today"),
    },
    async ({ sport, league, dates }) => {
      try {
        return text(await scoreboard(sport, league, dates))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
