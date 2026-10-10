import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { league, team, player } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "thesportsdb-mcp", version: "1.0.0" })
  server.registerTool(
    "team",
    {
      title: "Team",
      description: "Search teams.",
      inputSchema: z.object( { query: z.string().describe("Team name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await team(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "league",
    {
      title: "League",
      description: "Upcoming events for a league.",
      inputSchema: z.object( { id: z.number().describe("League id."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await league(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "league_table",
    {
      title: "League table",
      description: "Current league standings: rank, team, played, won, drawn, lost, goals for, goals against, goal difference and points.",
      inputSchema: z.object( { id: z.number().describe("League id, e.g. 4328 for the English Premier League."), limit: z.number().describe("Max rows.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: league_table ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_thesportsdb_league_table", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "league_teams",
    {
      title: "League teams",
      description: "Every team in a league with its id, short code, founding year, country and home stadium.",
      inputSchema: z.object( { league: z.string().describe("League name, e.g. 'English Premier League'."), limit: z.number().describe("Max teams.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: league_teams ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_thesportsdb_league_teams", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "player",
    {
      title: "Player",
      description: "One footballer's details: club, position, shirt number, nationality, date of birth, birthplace, height, weight and status.",
      inputSchema: z.object( { id: z.number().describe("Player id from TheSportsDB.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await player(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
