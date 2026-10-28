import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { departures, stations, routes, advisories, station_info, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "bart-mcp", version: "1.0.0" })

  server.tool(
    "departures",
    "Real-time departures from a BART station",
    {
      station: z.string().min(2).describe("Station abbreviation, e.g. 12th or EMBR")
    },
    async (a) => {
      try {
        return text(await departures(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "stations",
    "All BART stations with coordinates",
    {
      // no arguments
    },
    async (a) => {
      try {
        return text(await stations(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "routes",
    "BART routes and their colours",
    {
      // no arguments
    },
    async (a) => {
      try {
        return text(await routes(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "advisories",
    "Current BART service advisories",
    {
      // no arguments
    },
    async (a) => {
      try {
        return text(await advisories(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "station_info",
    "Details for one station: address, platforms and transit links",
    {
      station: z.string().min(2).describe("Station abbreviation, e.g. 12th")
    },
    async (a) => {
      try {
        return text(await station_info(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
