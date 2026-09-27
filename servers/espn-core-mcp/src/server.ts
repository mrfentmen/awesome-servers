import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { athletes, leagueNews, scoreboard, standings, teamRoster } from "./api.js"
import { teams } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "espn-core-mcp", version: "1.0.0" })
  server.registerTool(
    "teams",
    {
      title: "Teams",
      description: "List teams for a league.",
      inputSchema: z.object( { sport: z.string().describe("Sport like football.").optional(), league: z.string().describe("League like nfl.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await teams(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "athletes",
    {
      title: "Athletes",
      description: "List athletes for a team.",
      inputSchema: z.object( { team: z.string().describe("Team ref id."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await athletes(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "scoreboard",
    {
      title: "Scoreboard",
      description: "Live and recent scores for a league.",
      inputSchema: z.object( { sport: z.string().describe("Sport like football.").optional(), league: z.string().describe("League like nfl.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await scoreboard(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "team_roster",
    {
      title: "Team roster",
      description: "Roster with names, positions, jerseys.",
      inputSchema: z.object( { team: z.string().describe("Team id."), sport: z.string().describe("Sport like football.").optional(), league: z.string().describe("League like nfl.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await teamRoster(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "league_news",
    {
      title: "League news",
      description: "Latest headlines for a league.",
      inputSchema: z.object( { sport: z.string().describe("Sport like football.").optional(), league: z.string().describe("League like nfl.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await leagueNews(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "standings",
    {
      title: "Standings",
      description: "Win-loss standings for a league.",
      inputSchema: z.object( { sport: z.string().describe("Sport like football.").optional(), league: z.string().describe("League like nfl.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await standings(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
