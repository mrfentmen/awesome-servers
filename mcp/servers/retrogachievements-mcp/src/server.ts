import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { gameExtended, RaError, userProgress, setScorecard, libraryBreakdown } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "retrogachievements-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "game_extended",
    {
      title: "Game achievements",
      description: "A retro game with its achievement list. Find ids via rom-mcp.",
      inputSchema: z.object({
        game_id: z.string().describe("Numeric RetroAchievements game id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ game_id }) => {
      try {
        return text(await gameExtended(game_id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "user_progress",
    {
      title: "User progress",
      description: "A player's points, rank, and recently played games.",
      inputSchema: z.object({
        username: z.string().describe("RetroAchievements username"),
      }),
      annotations: READ_ONLY,
    },
    async ({ username }) => {
      try {
        return text(await userProgress(username))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "set_scorecard",
    {
      title: "Score a list of games",
      description: "Paste the games you have started and get your points against what each set offers, what is still on the table, and the order to grind in by points per remaining achievement. Computed locally, no account needed.",
      inputSchema: z.object({
        games: z.string().describe("One game per line: title | console | percentage | achievements owned | achievements total | game points"),
        set_name: z.string().optional().describe("What this list is, e.g. 'Genesis set'"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: set_scorecard ----
    const paywallMessage = await premiumRequired("set_scorecard")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await setScorecard(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "library_breakdown",
    {
      title: "Break a list down",
      description: "Summarise a pasted game list by console and completion band, list what is closest to finished, and rank the sets by points per achievement as a difficulty signal. Computed locally.",
      inputSchema: z.object({
        games: z.string().describe("One game per line: title | console | percentage | achievements owned | achievements total | game points"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await libraryBreakdown(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof RaError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
