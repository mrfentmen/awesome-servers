import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { findLocations, formatFlight, KiwiError, searchFlights } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "kiwi-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "find_locations",
    {
      title: "Find airports",
      description: "Airport codes by city name for flight search.",
      inputSchema: z.object({
        query: z.string().describe("City, e.g. 'Berlin'"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const rows = await findLocations(query, limit)
        if (rows.length === 0) return text(`No airports for "${query}".`)
        return text(rows.map((l, i) => `${i + 1}. ${l}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_flights",
    {
      title: "Search flights",
      description: "Cheapest flights between airports in a date range, with airlines and links.",
      inputSchema: z.object({
        from: z.string().describe("Origin code, e.g. 'JFK' (use find_locations)"),
        to: z.string().describe("Destination code, e.g. 'LHR'"),
        date_from: z.string().describe("Start date DD/MM/YYYY, e.g. '01/12/2026'"),
        date_to: z.string().describe("End date DD/MM/YYYY"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ from, to, date_from, date_to, limit }) => {
      try {
        const rows = await searchFlights(from, to, date_from, date_to, limit)
        if (rows.length === 0) return text(`No flights ${from} to ${to}.`)
        return text(rows.map((f, i) => formatFlight(f, i)).join("\n\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof KiwiError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
