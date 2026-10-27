import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { MlbError, playerInfo, schedule, standings, teamRecord, teamRoster, teamSchedule, teams } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof MlbError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const SEASON = new Date().getUTCFullYear()

export function createServer(): McpServer {
  const server = new McpServer({ name: "mlb-stats-mcp", version: "1.0.0" })

  server.tool(
    "list_teams",
    "Every MLB team with its id, grouped by division.",
    { sportId: z.number().int().min(1).max(30).default(1).describe("Sport id, 1 = MLB (default)") },
    async ({ sportId }) => {
      try {
        return text(await teams(sportId))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "standings",
    "Division standings with win-loss records and streaks.",
    {
      leagueId: z.string().default("103,104").describe("League ids: 103 = AL, 104 = NL (default both)"),
      season: z.number().int().min(1900).max(2100).default(SEASON).describe("Season year"),
    },
    async ({ leagueId, season }) => {
      try {
        return text(await standings(leagueId, season))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "games_on_date",
    "Every MLB game on one day, with scores when played.",
    {
      date: z.string().describe("Date as YYYY-MM-DD"),
      sportId: z.number().int().min(1).max(30).default(1).describe("Sport id, 1 = MLB"),
    },
    async ({ date, sportId }) => {
      try {
        return text(await schedule(date, sportId))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "team_roster",
    "Active roster for a team id, with positions and jersey numbers.",
    {
      teamId: z.number().int().positive().describe("Team id from list_teams"),
      season: z.number().int().min(1900).max(2100).default(SEASON).describe("Season year"),
    },
    async ({ teamId, season }) => {
      try {
        return text(await teamRoster(teamId, season))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "team_overview",
    "One team: league, division, venue and season record.",
    {
      teamId: z.number().int().positive().describe("Team id from list_teams"),
      season: z.number().int().min(1900).max(2100).default(SEASON).describe("Season year"),
    },
    async ({ teamId, season }) => {
      try {
        return text(await teamRecord(teamId, season))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "player_profile",
    "Player bio plus headline season stats.",
    { personId: z.number().int().positive().describe("Player id (personId)") },
    async ({ personId }) => {
      try {
        return text(await playerInfo(personId))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "team_schedule",
    "A team's season schedule: next five games and last five results.",
    {
      teamId: z.number().int().positive().describe("Team id from list_teams"),
      season: z.number().int().min(1900).max(2100).default(SEASON).describe("Season year"),
    },
    async ({ teamId, season }) => {
      try {
        return text(await teamSchedule(teamId, season))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
