import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { mlbScores, nbaScores, nflScores } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "sports-scores-mcp", version: "1.0.0" })
  server.registerTool(
    "nba_scores",
    {
      title: "Nba scores",
      description: "Today NBA scores and game states.",
      inputSchema: z.object( { limit: z.number().describe("Max games.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await nbaScores(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "nfl_scores",
    {
      title: "Nfl scores",
      description: "Today NFL scores and game states.",
      inputSchema: z.object( { limit: z.number().describe("Max games.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await nflScores(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "mlb_scores",
    {
      title: "Mlb scores",
      description: "Today MLB scores and game states.",
      inputSchema: z.object( { limit: z.number().describe("Max games.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await mlbScores(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "nhl_scores",
    {
      title: "NHL scores",
      description: "NHL scores from ESPN's scoreboard, which the basketball, football and baseball boards do not carry.",
      inputSchema: z.object( { limit: z.number().describe("Max games.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: nhl_scores ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_sports_scores_nhl_scores", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "soccer_scores",
    {
      title: "Soccer scores",
      description: "Soccer scores for a league on ESPN's scoreboard, with the league slug, which the other three sport tools do not cover.",
      inputSchema: z.object( { league: z.string().describe("League slug, e.g. eng.1.").optional(), limit: z.number().describe("Max games.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: soccer_scores ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_sports_scores_soccer_scores", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
