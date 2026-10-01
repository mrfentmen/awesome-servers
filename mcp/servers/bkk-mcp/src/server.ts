import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchStops,
  getDepartures,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "bkk-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_stops",
    {
      title: "Search nearby stops",
      description: "BKK stops near coordinates with ids, names and routes.",
      inputSchema: z.object({
        lat: z.number().describe("Latitude"),
        lon: z.number().describe("Longitude"),
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lon }) => {
      try {
        return text(await searchStops(lat, lon));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_departures",
    {
      title: "Get departures",
      description: "Live BKK arrivals and departures for a stop with delays and trip headsigns.",
      inputSchema: z.object({
        stopId: z.string().describe("Stop id from search_stops"),
        minutesAfter: z.number().default(30).describe("Look-ahead minutes"),
      }),
      annotations: READ_ONLY,
    },
    async ({ stopId, minutesAfter }) => {
      try {
        return text(await getDepartures(stopId, minutesAfter));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
