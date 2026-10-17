import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { findLocations, formatFlight, KiwiError, searchFlights, airportLookup, routeNetwork } from "./api.js"

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
        return textError(String(e))
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
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "airport_lookup",
    {
      title: "Airport lookup",
      description: "Airports from the OurAirports data set: name, IATA and ICAO, city, country, type, whether it has scheduled service, coordinates and elevation. No key, no rate limit, no booking portal involved.",
      inputSchema: z.object({ code: z.string().describe("Three or four letter airport code, e.g. LHR.").optional(), city: z.string().describe("City or municipality name to search for.").optional(), limit: z.number().int().min(1).max(25).default(5).describe("How many matches to print (default 5, max 25).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await airportLookup(args)) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "route_network",
    {
      title: "Route network",
      description: "Does anybody fly this route and who: the OpenFlights route network for a city pair, with airline, codeshare flag, stop count and equipment. A different question from a fare search.",
      inputSchema: z.object({ from: z.string().describe("Origin airport code, e.g. LHR"), to: z.string().describe("Destination airport code, e.g. JFK"), limit: z.number().int().min(1).max(30).default(10).describe("How many route records to print (default 10, max 30).") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await routeNetwork(args)) } catch (e) { return textError(String(e)) }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof KiwiError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
