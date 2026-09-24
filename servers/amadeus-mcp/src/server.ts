import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { AmadeusError, formatOffer, searchAirports, searchFlights } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "amadeus-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_airports",
    {
      title: "Search airports",
      description: "Airport codes by city name.",
      inputSchema: z.object({
        keyword: z.string().describe("City, e.g. 'Berlin'"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ keyword, limit }) => {
      try {
        const rows = await searchAirports(keyword, limit)
        if (rows.length === 0) return text(`No airports for "${keyword}".`)
        return text(rows.map((a, i) => `${i + 1}. ${a}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_flights",
    {
      title: "Search flights",
      description: "Flight offers with prices and legs (test environment data).",
      inputSchema: z.object({
        origin: z.string().describe("Origin code, e.g. 'JFK'"),
        destination: z.string().describe("Destination code, e.g. 'LHR'"),
        date: z.string().describe("Departure YYYY-MM-DD"),
        adults: z.number().int().min(1).max(9).default(1),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ origin, destination, date, adults, limit }) => {
      try {
        const rows = await searchFlights(origin, destination, date, adults, limit)
        if (rows.length === 0) return text("No flight offers.")
        return text(rows.map((o, i) => formatOffer(o, i)).join("\n\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof AmadeusError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
