import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_current, m0_drivers, m0_races, m1_driverStandings, m1_lastRace, m1_seasonSchedule } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'jolpica-mcp', version: '1.0.0' })
server.registerTool(
    "current",
    {
      title: "Current",
      description: "Current F1 season summary.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_current(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "races",
    {
      title: "Races",
      description: "Races in a season.",
      inputSchema: z.object( { year: z.number().describe("Season year.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_races(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "drivers",
    {
      title: "Drivers",
      description: "Drivers in a season.",
      inputSchema: z.object( { year: z.number().describe("Season year.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_drivers(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "last_race",
    {
      title: "Last race",
      description: "Results from the most recent race.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_lastRace(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "driver_standings",
    {
      title: "Driver standings",
      description: "Current driver standings.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_driverStandings(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "season_schedule",
    {
      title: "Season schedule",
      description: "The race schedule for a season.",
      inputSchema: z.object( { season: z.number().describe("Season year.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_seasonSchedule(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "constructor_standings",
    {
      title: "Constructor standings",
      description: "The constructor championship: points, wins and the points share of the leader, which the driver standings table never shows.",
      inputSchema: z.object({ season: z.string().describe("Season, 'current' or a four digit year.").optional(), limit: z.number().int().min(1).max(30).default(10).describe("How many teams to show (default 10, max 30).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement standings locally (paywall removed)
      try { return textError("Not yet implemented: standings") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "qualifying_report",
    {
      title: "Qualifying report",
      description: "Qualifying for a round: the grid order with each driver's Q1, Q2 and Q3 times, for the last round by default.",
      inputSchema: z.object({ round: z.string().describe("Round number, e.g. 15. The last round by default.").optional(), season: z.string().describe("Season, 'current' or a four digit year.").optional(), limit: z.number().int().min(1).max(30).default(10).describe("How many drivers to show (default 10, max 30).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement report locally (paywall removed)
      try { return textError("Not yet implemented: report") } catch (e) { return textError(String(e)) }
    }
  )
const serverName = "jolpica-mcp"

  server.registerTool(
    "health_check",
    {
      title: "Health check",
      description: "Check if the server is running and responsive.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("OK - server is running")
    }
  )
  server.registerTool(
    "version_info",
    {
      title: "Version info",
      description: "Get server version and metadata.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2))
    }
  )


  return server
}
