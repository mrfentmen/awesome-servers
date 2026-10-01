import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { departures } from "./api.js"
import { stops, stopPunctuality, lineDepartures, stopBoardByMode, journeyPlan } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "berlin-bvg-mcp", version: "1.0.0" })
  server.registerTool(
    "stops",
    {
      title: "Stops",
      description: "Search stops.",
      inputSchema: z.object( { query: z.string().describe("Stop name."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await stops(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "departures",
    {
      title: "Departures",
      description: "Departures at a stop.",
      inputSchema: z.object( { id: z.string().describe("Stop id."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await departures(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "stop_punctuality",
    {
      title: "Stop punctuality",
      description: "How late the board at a BVG stop actually is: every departure with a delay ranked worst first, on time versus late counts, the mean, and any operational notes attached to the departures.",
      inputSchema: z.object({
        id: z.string().describe("BVG stop id, from the stops tool."),
        limit: z.number().optional().describe("How many departures to rank, 1-40. Defaults to 20."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await stopPunctuality(args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "line_departures",
    {
      title: "Line departures",
      description: "Follow one line on its own out of a stop's board, with its headway, destination split and punctuality, instead of the whole board mixed together.",
      inputSchema: z.object({
        id: z.string().describe("BVG stop id, from the stops tool."),
        line: z.string().describe("Line name exactly as the board prints it, e.g. U5, S9 or N60."),
        limit: z.number().optional().describe("How many departures to list, 1-30. Defaults to 12."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await lineDepartures(args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "stop_board_by_mode",
    {
      title: "Board by transport",
      description: "What is on a BVG stop board grouped by kind of transport: how many departures of each, which lines, the soonest of each, and whether anything is reporting crowding.",
      inputSchema: z.object({
        id: z.string().describe("BVG stop id, from the stops tool."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await stopBoardByMode(args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "journey_plan",
    {
      title: "Journey plan",
      description: "Plan a real journey between two BVG stop ids: every leg with its line, direction, platform, operator and delay, the interchanges with their waits, total duration and whether the stop board reported realtime data.",
      inputSchema: z.object({
        from: z.string().describe("Origin stop id, e.g. 900100003."),
        to: z.string().describe("Destination stop id, e.g. 900120005."),
        when: z.string().describe("Departure time as YYYY-MM-DDTHH:MM, omit for the next departure.").optional(),
        results: z.number().int().min(1).max(6).default(3).describe("How many journeys to print (default 3, max 6)."),
        transfers: z.boolean().default(false).describe("Include interchange details (default false)."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await journeyPlan(args)) } catch (e) { return textError(error(e)) }
    }
  )

  return server
}
